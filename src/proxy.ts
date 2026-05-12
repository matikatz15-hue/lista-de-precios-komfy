import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_COOKIE = "kf_role";

function needsAuthCheck(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname === "/login";
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  if (!needsAuthCheck(pathname)) return response;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return response;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always call getUser so Supabase SSR refreshes the access token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Role check: prefer the cached cookie (skips a DB roundtrip ~100-200ms per nav).
  const cachedRole = request.cookies.get(ROLE_COOKIE)?.value;

  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect_to", pathname);
      return NextResponse.redirect(url);
    }

    let role: string | undefined = cachedRole;
    if (role !== "admin" && role !== "client") {
      // Cookie missing or unexpected value → check DB once and re-seed.
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, active")
        .eq("id", user.id)
        .single();
      if (!profile || !profile.active) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      role = profile.role as string;
      response.cookies.set(ROLE_COOKIE, role, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      });
    }

    if (role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  if (isLoginRoute && user) {
    const role =
      cachedRole === "admin" || cachedRole === "client"
        ? cachedRole
        : (
            await supabase.from("profiles").select("role").eq("id", user.id).single()
          ).data?.role;

    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
