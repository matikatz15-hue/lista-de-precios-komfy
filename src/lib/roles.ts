import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type Rol = Profile["role"];

export const ROLE_COOKIE = "kf_role";
export const ROLE_COOKIE_MAX_AGE = 60 * 60 * 8; // 8 horas

// Valores de kf_role en los que confiamos sin ir a la base (igual que el proxy).
export function esRolValido(v: string | undefined | null): v is Rol {
  return v === "admin" || v === "client" || v === "viewer";
}

// Equipo Komfy: entra al /admin. "viewer" solo mira.
export function esStaff(rol: string | undefined | null): rol is "admin" | "viewer" {
  return rol === "admin" || rol === "viewer";
}

// Rol para la UI del admin: cookie kf_role si es un valor conocido; si no, el perfil en la base.
// Solo decide qué se muestra (banner / solo lectura). Las escrituras las frena requireEditor() + RLS.
export async function rolDelPanel(): Promise<Rol | null> {
  const cookieStore = await cookies();
  const cacheado = cookieStore.get(ROLE_COOKIE)?.value;
  if (esRolValido(cacheado)) return cacheado;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, active").eq("id", user.id).single();
  if (!profile?.active) return null;
  return esRolValido(profile.role) ? profile.role : null;
}

export const SOLO_LECTURA_MSG = "Solo mirás: los cambios se piden a Mati.";

// Devuelve null si la sesión puede editar (perfil admin y activo); si no, el motivo.
// Lee el perfil de la sesión en la base, no la cookie.
export async function motivoNoEditor(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "Sesión vencida, volvé a entrar.";
  const { data: profile } = await supabase.from("profiles").select("role, active").eq("id", user.id).single();
  if (!profile?.active || profile.role !== "admin") return SOLO_LECTURA_MSG;
  return null;
}

// Para server actions que escriben: corta con un error si la sesión no es admin.
export async function requireEditor(): Promise<void> {
  const motivo = await motivoNoEditor();
  if (motivo) throw new Error(motivo);
}
