"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ROLE_COOKIE = "kf_role";
const ROLE_COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "");

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !signInData.user) {
    redirect(`/login?error=${encodeURIComponent("Credenciales incorrectas")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", signInData.user.id)
    .single();

  if (!profile?.active) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent("Usuario desactivado. Contactá al admin.")}`);
  }

  // Cache role + email in cookies so proxy + layout skip DB queries on every nav
  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE, profile.role, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ROLE_COOKIE_MAX_AGE,
  });
  cookieStore.set("kf_email", email, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ROLE_COOKIE_MAX_AGE,
  });

  // Entró con contraseña: en la próxima pantalla le ofrecemos activar huella o cara
  // en este dispositivo (el pop-up se fija si ya la tiene). Lo lee el navegador, dura 10 min.
  cookieStore.set("kf_bio_ofrecer", "1", { secure: true, sameSite: "lax", path: "/", maxAge: 600 });

  if (redirectTo && redirectTo.startsWith("/")) {
    if (redirectTo.startsWith("/admin") && profile.role !== "admin" && profile.role !== "viewer") {
      redirect("/");
    }
    redirect(redirectTo);
  }

  redirect(profile.role === "admin" || profile.role === "viewer" ? "/admin" : "/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ROLE_COOKIE);
  cookieStore.delete("kf_email");
  redirect("/");
}
