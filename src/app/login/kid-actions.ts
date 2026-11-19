"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ROLE_COOKIE, ROLE_COOKIE_MAX_AGE, esStaff } from "@/lib/roles";

// Equipo Komfy: Komfy ID (sesion_lista) ya creó/actualizó el usuario de GoTrue y su perfil
// y nos dio un token_hash de magic link. Acá abrimos la sesión de Supabase con las cookies
// del sitio y dejamos el rol (admin | viewer) en kf_role.
export async function entrarEquipo(
  tokenHash: string,
  email: string,
  redirectTo?: string
): Promise<{ destino: string } | { error: string }> {
  if (!tokenHash || typeof tokenHash !== "string") return { error: "No se pudo abrir la sesión." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  const user = data?.user;
  if (error || !user) return { error: "No se pudo abrir la sesión. Probá de nuevo." };

  if (email && user.email && user.email.toLowerCase() !== email.trim().toLowerCase()) {
    await supabase.auth.signOut();
    return { error: "No se pudo abrir la sesión." };
  }

  const { data: profile } = await supabase.from("profiles").select("role, active").eq("id", user.id).single();
  if (!profile?.active || !esStaff(profile.role)) {
    await supabase.auth.signOut();
    return { error: "Tu usuario de Komfy ID no tiene acceso a la lista. Pedíselo a Mati." };
  }

  const cookieStore = await cookies();
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: ROLE_COOKIE_MAX_AGE };
  cookieStore.set(ROLE_COOKIE, profile.role, opts);
  cookieStore.set("kf_email", user.email ?? email, opts);

  const destino =
    redirectTo && redirectTo.startsWith("/admin") && !redirectTo.startsWith("//") ? redirectTo : "/admin";
  return { destino };
}
