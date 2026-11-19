"use server";

import { cookies, headers } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHALLENGE_TTL_MS, ORIGIN, RP_ID, RP_NAME, nombreDispositivo } from "@/lib/passkeys";

const ROLE_COOKIE_MAX_AGE = 60 * 60 * 8;

// Toma un desafío vigente y lo quema (un solo uso).
async function tomarDesafio(id: string, tipo: "registro" | "ingreso", userId?: string) {
  const admin = createAdminClient();
  let q = admin
    .from("lp_challenges")
    .update({ usado: true })
    .eq("id", id)
    .eq("tipo", tipo)
    .eq("usado", false)
    .gte("created_at", new Date(Date.now() - CHALLENGE_TTL_MS).toISOString());
  q = userId ? q.eq("user_id", userId) : q.is("user_id", null);
  const { data } = await q.select("challenge").maybeSingle();
  return data?.challenge ?? null;
}

async function guardarDesafio(challenge: string, tipo: "registro" | "ingreso", userId: string | null) {
  const admin = createAdminClient();
  // limpieza de desafíos viejos
  await admin.from("lp_challenges").delete().lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  const { data, error } = await admin
    .from("lp_challenges")
    .insert({ challenge, tipo, user_id: userId })
    .select("id")
    .single();
  if (error || !data) throw new Error("No se pudo iniciar");
  return data.id as string;
}

// ---------- Entrar ----------

export async function opcionesIngreso(): Promise<
  { id: string; options: PublicKeyCredentialRequestOptionsJSON } | { error: string }
> {
  try {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "required",
      timeout: 60000,
    });
    const id = await guardarDesafio(options.challenge, "ingreso", null);
    return { id, options };
  } catch {
    return { error: "No se pudo iniciar el ingreso. Probá de nuevo." };
  }
}

export async function ingresarConPasskey(
  id: string,
  response: AuthenticationResponseJSON,
  redirectTo: string
): Promise<{ destino: string } | { error: string }> {
  const fallo = { error: "No reconocimos esta huella o cara. Entrá con tu contraseña y activala de nuevo." };
  const challenge = await tomarDesafio(id, "ingreso");
  if (!challenge) return { error: "Se venció el intento. Probá de nuevo." };

  const admin = createAdminClient();
  const { data: llave } = await admin
    .from("lp_passkeys")
    .select("id, user_id, public_key, counter, transports")
    .eq("credential_id", response.id)
    .maybeSingle();
  if (!llave) return fallo;

  let verificado;
  try {
    verificado = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
      credential: {
        id: response.id,
        publicKey: isoBase64URL.toBuffer(llave.public_key),
        counter: Number(llave.counter),
        transports: (llave.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
      },
    });
  } catch {
    return fallo;
  }
  if (!verificado.verified) return fallo;

  await admin
    .from("lp_passkeys")
    .update({ counter: verificado.authenticationInfo.newCounter, last_used_at: new Date().toISOString() })
    .eq("id", llave.id);

  const { data: profile } = await admin
    .from("profiles")
    .select("role, active, email")
    .eq("id", llave.user_id)
    .single();
  if (!profile?.active) return { error: "Usuario desactivado. Contactá al admin." };

  const { data: u } = await admin.auth.admin.getUserById(llave.user_id);
  const email = u.user?.email;
  if (!email) return fallo;

  // Abre la sesión de Supabase de esa persona (mismo login que con contraseña).
  const { data: link, error: eLink } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (eLink || !link.properties?.hashed_token) return { error: "No se pudo abrir la sesión." };
  const supabase = await createClient();
  const { error: eOtp } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.properties.hashed_token,
  });
  if (eOtp) return { error: "No se pudo abrir la sesión." };

  const cookieStore = await cookies();
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: ROLE_COOKIE_MAX_AGE };
  cookieStore.set("kf_role", profile.role, opts);
  cookieStore.set("kf_email", email, opts);

  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    if (redirectTo.startsWith("/admin") && profile.role !== "admin") return { destino: "/" };
    return { destino: redirectTo };
  }
  return { destino: profile.role === "admin" ? "/admin" : "/" };
}

// ---------- Activar en este dispositivo (ya logueado) ----------

export async function opcionesRegistro(): Promise<
  { id: string; options: PublicKeyCredentialCreationOptionsJSON } | { error: string }
> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user?.email) return { error: "Tenés que entrar primero con tu contraseña." };

  const admin = createAdminClient();
  const [{ data: existentes }, { data: profile }] = await Promise.all([
    admin.from("lp_passkeys").select("credential_id, transports").eq("user_id", user.id),
    admin.from("profiles").select("full_name, active").eq("id", user.id).single(),
  ]);
  if (!profile?.active) return { error: "Usuario desactivado." };

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: user.email,
    userDisplayName: profile.full_name || user.email,
    userID: new TextEncoder().encode(user.id),
    attestationType: "none",
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    excludeCredentials: (existentes ?? []).map((e) => ({
      id: e.credential_id,
      transports: (e.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    })),
    timeout: 60000,
  });
  const id = await guardarDesafio(options.challenge, "registro", user.id);
  return { id, options };
}

export async function registrarPasskey(
  id: string,
  response: RegistrationResponseJSON
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { error: "Tenés que entrar primero con tu contraseña." };

  const challenge = await tomarDesafio(id, "registro", user.id);
  if (!challenge) return { error: "Se venció el intento. Probá de nuevo." };

  let verificado;
  try {
    verificado = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });
  } catch {
    return { error: "No se pudo activar. Probá de nuevo." };
  }
  if (!verificado.verified || !verificado.registrationInfo) return { error: "No se pudo activar." };

  const { credential } = verificado.registrationInfo;
  const ua = (await headers()).get("user-agent") ?? "";
  const admin = createAdminClient();
  const { error } = await admin.from("lp_passkeys").insert({
    user_id: user.id,
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? null,
    dispositivo: nombreDispositivo(ua),
  });
  if (error) return { error: error.code === "23505" ? "Este dispositivo ya estaba activado." : "No se pudo guardar." };
  return { ok: true };
}
