"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  if (redirectTo && redirectTo.startsWith("/")) {
    if (redirectTo.startsWith("/admin") && profile.role !== "admin") {
      redirect("/");
    }
    redirect(redirectTo);
  }

  redirect(profile.role === "admin" ? "/admin" : "/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
