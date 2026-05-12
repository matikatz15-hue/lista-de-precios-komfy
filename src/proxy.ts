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

  // Fast path: trust the role cookie set at login (no DB query, no auth.getUser).
  // The cookie has an 8-hour TTL; the actual auth session is still validated
  // by Supabase SSR via the supabase cookies on every server action / page render.
  const cachedRole = request.cookies.get(ROLE_COOKIE)?.value;

  if (cachedRole && isAdminRoute) {
    if (cachedRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    // Admin role cached → allow without hitting Supabase
    return response;
  }

  if (cachedRole && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = cachedRole === "admin" ? "/admin" : "/";
    return NextResponse.redirect(url);
  }

  // Slow path: no role cookie. Do the full check.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect_to", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin" || !profile.active) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Re-seed the role cookie so subsequent requests are fast.
    response.cookies.set(ROLE_COOKIE, profile.role, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  }

  if (isLoginRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname = profile?.role === "admin" ? "/admin" : "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
