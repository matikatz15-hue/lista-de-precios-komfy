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
import {
  CHALLENGE_TTL_MS,
  CODIGO_MAX_INTENTOS,
  ORIGIN,
  RP_ID,
  RP_NAME,
  hashCodigo,
  igualSeguro,
  nombreDispositivo,
  normalizarCodigo,
} from "@/lib/passkeys";

const ROLE_COOKIE_MAX_AGE = 60 * 60 * 8;
type Tipo = "registro" | "ingreso";

// Toma un desafío vigente y lo quema (un solo uso).
async function tomarDesafio(id: string, tipo: Tipo, userId?: string) {
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

async function guardarDesafio(challenge: string, tipo: Tipo, userId: string | null) {
  const admin = createAdminClient();
  await admin.from("lp_challenges").delete().lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  const { data, error } = await admin
    .from("lp_challenges")
    .insert({ challenge, tipo, user_id: userId })
    .select("id")
    .single();
  if (error || !data) throw new Error("No se pudo iniciar");
  return data.id as string;
}

// Abre la sesión de Supabase de esa persona (la misma que con contraseña) y devuelve a dónde ir.
async function abrirSesion(userId: string, redirectTo: string): Promise<{ destino: string } | { error: string }> {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role, active").eq("id", userId).single();
  if (!profile?.active) return { error: "Usuario desactivado. Contactá al admin." };
  const { data: u } = await admin.auth.admin.getUserById(userId);
  const email = u.user?.email;
  if (!email) return { error: "No se pudo abrir la sesión." };

  const { data: link, error: eLink } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (eLink || !link.properties?.hashed_token) return { error: "No se pudo abrir la sesión." };
  const supabase = await createClient();
  const { error: eOtp } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (eOtp) return { error: "No se pudo abrir la sesión." };

  const cookieStore = await cookies();
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: ROLE_COOKIE_MAX_AGE };
  cookieStore.set("kf_role", profile.role, opts);
  cookieStore.set("kf_email", email, opts);

  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    if (redirectTo.startsWith("/admin") && profile.role !== "admin" && profile.role !== "viewer") return { destino: "/" };
    return { destino: redirectTo };
  }
  return { destino: profile.role === "admin" || profile.role === "viewer" ? "/admin" : "/" };
}

// ---------- Entrar con huella o cara ----------

export async function opcionesIngreso(): Promise<
  { id: string; options: PublicKeyCredentialRequestOptionsJSON } | { error: string }
> {
  try {
    const options = await generateAuthenticationOptions({ rpID: RP_ID, userVerification: "required", timeout: 60000 });
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
  const fallo = { error: "No reconocimos este dispositivo. Pedile a Komfy un código para activarlo." };
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

  return abrirSesion(llave.user_id, redirectTo);
}

// ---------- Activar este dispositivo con el código que da el admin ----------

const CODIGO_INVALIDO = "Email o código incorrecto, o el código ya venció. Pedile uno nuevo a Komfy.";

// Chequea email + código. Si no coincide suma un intento; al 5º el código se anula.
async function validarCodigo(email: string, codigo: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, active")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (!profile?.active) return null;
  const { data: c } = await admin.from("lp_codigos").select("hash, expira, intentos").eq("user_id", profile.id).maybeSingle();
  if (!c) return null;
  if (new Date(c.expira) < new Date() || c.intentos >= CODIGO_MAX_INTENTOS) {
    await admin.from("lp_codigos").delete().eq("user_id", profile.id);
    return null;
  }
  if (!igualSeguro(await hashCodigo(normalizarCodigo(codigo)), c.hash)) {
    const n = c.intentos + 1;
    if (n >= CODIGO_MAX_INTENTOS) await admin.from("lp_codigos").delete().eq("user_id", profile.id);
    else await admin.from("lp_codigos").update({ intentos: n }).eq("user_id", profile.id);
    return null;
  }
  return profile.id as string;
}

export async function opcionesActivacion(
  email: string,
  codigo: string
): Promise<{ id: string; options: PublicKeyCredentialCreationOptionsJSON } | { error: string }> {
  const userId = await validarCodigo(email, codigo);
  if (!userId) return { error: CODIGO_INVALIDO };

  const admin = createAdminClient();
  const [{ data: existentes }, { data: profile }, { data: u }] = await Promise.all([
    admin.from("lp_passkeys").select("credential_id, transports").eq("user_id", userId),
    admin.from("profiles").select("full_name").eq("id", userId).single(),
    admin.auth.admin.getUserById(userId),
  ]);
  const mail = u.user?.email ?? email;

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: mail,
    userDisplayName: profile?.full_name || mail,
    userID: new TextEncoder().encode(userId),
    attestationType: "none",
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    excludeCredentials: (existentes ?? []).map((e) => ({
      id: e.credential_id,
      transports: (e.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    })),
    timeout: 60000,
  });
  const id = await guardarDesafio(options.challenge, "registro", userId);
  return { id, options };
}

export async function activarConCodigo(
  id: string,
  response: RegistrationResponseJSON,
  email: string,
  codigo: string,
  redirectTo: string
): Promise<{ destino: string } | { error: string }> {
  const userId = await validarCodigo(email, codigo);
  if (!userId) return { error: CODIGO_INVALIDO };
  const challenge = await tomarDesafio(id, "registro", userId);
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
    user_id: userId,
    credential_id: credential.id,
    public_key: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? null,
    dispositivo: nombreDispositivo(ua),
  });
  if (error) return { error: error.code === "23505" ? "Este dispositivo ya estaba activado." : "No se pudo guardar." };

  // el código se quema al usarse
  await admin.from("lp_codigos").delete().eq("user_id", userId);
  return abrirSesion(userId, redirectTo);
}
