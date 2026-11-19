"use client";

import { useState, useSyncExternalStore } from "react";
import { entrarEquipo } from "@/app/login/kid-actions";

// Equipo Komfy: entra con Komfy ID (la identidad central, cara o huella).
// Mismo protocolo que el resto de las apps (ver stock/index.html en komfy-data):
// login_inicio → navigator.credentials.get → login_fin → token (x-kid-token) → sesion_lista.
// Las llaves de Komfy ID son aparte de las de clientes (lp_passkeys).

const KID_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/komfy-id`;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

class KidError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

async function kidApi(action: string, body?: object, token?: string): Promise<Json> {
  const h: Record<string, string> = {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
  };
  if (token) h["x-kid-token"] = token;
  const r = await fetch(`${KID_URL}?action=${encodeURIComponent(action)}`, {
    method: body ? "POST" : "GET",
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new KidError(d.error || `HTTP ${r.status}`, d.code);
  return d;
}

// base64url <-> ArrayBuffer
function b64u(b: ArrayBuffer): string {
  const bytes = new Uint8Array(b);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function buf(s: string): ArrayBuffer {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b + "=".repeat((4 - (b.length % 4)) % 4));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}

type CredDesc = { id: string; transports?: AuthenticatorTransport[] };
const aDesc = (cs: CredDesc[] | undefined): PublicKeyCredentialDescriptor[] =>
  (cs ?? []).map((c) => ({ type: "public-key", id: buf(c.id), transports: c.transports }));

function cuerpoLogin(cred: PublicKeyCredential, usuario: string | null) {
  const r = cred.response as AuthenticatorAssertionResponse;
  return {
    usuario: usuario || null,
    id: cred.id,
    rawId: b64u(cred.rawId),
    type: cred.type,
    authenticatorAttachment: cred.authenticatorAttachment || undefined,
    clientExtensionResults: cred.getClientExtensionResults(),
    response: {
      clientDataJSON: b64u(r.clientDataJSON),
      authenticatorData: b64u(r.authenticatorData),
      signature: b64u(r.signature),
      userHandle: r.userHandle ? b64u(r.userHandle) : undefined,
    },
  };
}

function nombreDisp(): string {
  const u = navigator.userAgent;
  if (/iPhone/.test(u)) return "iPhone";
  if (/iPad/.test(u)) return "iPad";
  if (/Android/.test(u)) return "Android";
  if (/Mac/.test(u)) return "Mac";
  if (/Windows/.test(u)) return "Windows";
  return "Dispositivo";
}

const leerUsuario = () => {
  try {
    return localStorage.getItem("kid-user") || "";
  } catch {
    return "";
  }
};
const guardarUsuario = (u: string) => {
  try {
    if (u) localStorage.setItem("kid-user", u);
  } catch {}
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d4d4d8",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  background: "white",
};

const botonEquipo = (cargando: boolean): React.CSSProperties => ({
  width: "100%",
  background: "#1C1C1C",
  color: "white",
  fontWeight: 700,
  padding: "11px 16px",
  borderRadius: 8,
  border: 0,
  cursor: cargando ? "wait" : "pointer",
  opacity: cargando ? 0.7 : 1,
  fontSize: 14,
  fontFamily: "inherit",
});

class Silencio extends Error {}

const sinSuscripcion = () => () => {};
const hayWebAuthn = () => !!(window.PublicKeyCredential && navigator.credentials);

export function KomfyIdLogin({ redirectTo }: { redirectTo?: string }) {
  // En el servidor asumimos que sí; en el navegador se chequea de verdad.
  const soportado = useSyncExternalStore(sinSuscripcion, hayWebAuthn, () => true);
  // Usuario recordado en este dispositivo (como en las otras apps) hasta que la persona lo cambie.
  const recordado = useSyncExternalStore(sinSuscripcion, leerUsuario, () => "");
  const [usuarioTipeado, setUsuario] = useState<string | null>(null);
  const usuario = usuarioTipeado ?? recordado;
  const [modo, setModo] = useState<"entrar" | "codigo" | "fuera">("entrar");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");

  function manejarError(e: unknown, porDefecto: string) {
    if (e instanceof Silencio) return;
    const err = e as KidError;
    if (err?.name === "NotAllowedError" || err?.name === "AbortError") {
      setError("Cancelaste o se agotó el tiempo.");
    } else if (err?.name === "InvalidStateError") {
      setError("Este dispositivo ya está activado: usá «Entrar con Komfy ID».");
    } else if (err?.code === "fuera_horario") {
      setAviso(err.message || "Estás fuera de tu horario.");
      setModo("fuera");
    } else {
      setError(err?.message || porDefecto);
    }
  }

  // Con el token de Komfy ID: pedimos la sesión de la lista y la abrimos en el servidor.
  async function abrirSesion(token: string) {
    const s = await kidApi("sesion_lista", {}, token);
    if (!s?.token_hash) throw new KidError("No se pudo abrir la sesión.");
    const r = await entrarEquipo(s.token_hash, s.email ?? "", redirectTo ?? "");
    if ("error" in r) throw new KidError(r.error);
    window.location.assign(r.destino);
  }

  async function loginBio(u: string) {
    const o = await kidApi("login_inicio", u ? { usuario: u } : {});
    if (u && !(o.allowCredentials || []).length) {
      setError(
        "Este dispositivo todavía no está activado para ese usuario. Pedile un código a Mati y usá «Tengo un código para este dispositivo»."
      );
      throw new Silencio();
    }
    const pk: PublicKeyCredentialRequestOptions = {
      challenge: buf(o.challenge),
      rpId: o.rpId,
      timeout: o.timeout,
      userVerification: o.userVerification,
    };
    if ((o.allowCredentials || []).length) pk.allowCredentials = aDesc(o.allowCredentials);
    const cred = (await navigator.credentials.get({ publicKey: pk })) as PublicKeyCredential | null;
    if (!cred) throw new KidError("No se pudo entrar.");
    const d = await kidApi("login_fin", cuerpoLogin(cred, u || null));
    guardarUsuario(u || d.usuario || "");
    if (!d.token) throw new KidError("No se pudo entrar.");
    await abrirSesion(d.token);
  }

  async function entrar() {
    setError(null);
    setAviso(null);
    setCargando(true);
    try {
      await loginBio(usuario.trim());
    } catch (e) {
      manejarError(e, "No se pudo entrar.");
      setCargando(false);
    }
  }

  async function enrolar(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setAviso(null);
    const u = usuario.trim();
    const c = codigo.trim();
    if (!u || !c) {
      setError("Completá usuario y código.");
      return;
    }
    setCargando(true);
    try {
      const base = { usuario: u, codigo: c };
      const o = await kidApi("registro_inicio", base);
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge: buf(o.challenge),
          rp: o.rp,
          timeout: o.timeout,
          attestation: o.attestation,
          user: { id: buf(o.user.id), name: o.user.name, displayName: o.user.displayName },
          pubKeyCredParams: o.pubKeyCredParams,
          authenticatorSelection: { ...(o.authenticatorSelection || {}), authenticatorAttachment: "platform" },
          excludeCredentials: aDesc(o.excludeCredentials),
        },
      })) as PublicKeyCredential | null;
      if (!cred) throw new KidError("No se pudo activar.");
      const r = cred.response as AuthenticatorAttestationResponse;
      const fin = await kidApi("registro_fin", {
        ...base,
        apodo: nombreDisp(),
        id: cred.id,
        rawId: b64u(cred.rawId),
        type: cred.type,
        authenticatorAttachment: cred.authenticatorAttachment || undefined,
        clientExtensionResults: cred.getClientExtensionResults(),
        response: {
          clientDataJSON: b64u(r.clientDataJSON),
          attestationObject: b64u(r.attestationObject),
          transports: r.getTransports ? r.getTransports() : [],
        },
      });
      guardarUsuario(u);
      setCodigo("");
      setModo("entrar");
      // Activado: si Komfy ID ya devolvió sesión la usamos; si no, entramos con la llave nueva.
      if (fin?.token) await abrirSesion(fin.token);
      else await loginBio(u);
    } catch (e) {
      manejarError(e, "No se pudo activar.");
      setCargando(false);
    }
  }

  const errorBox = error && (
    <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px" }}>
      {error}
    </div>
  );

  const link = (texto: string, a: "entrar" | "codigo") => (
    <button
      type="button"
      onClick={() => {
        setError(null);
        setAviso(null);
        setModo(a);
      }}
      style={{ display: "block", margin: "10px auto 0", background: "none", border: 0, color: "#6B6359", fontSize: 12, textDecoration: "underline", cursor: "pointer", fontFamily: "inherit" }}
    >
      {texto}
    </button>
  );

  return (
    <section
      aria-labelledby="equipo-komfy"
      style={{ marginTop: 26, paddingTop: 20, borderTop: "1px dashed #e4dccd" }}
    >
      <div
        id="equipo-komfy"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".22em", color: "#0047BB", textTransform: "uppercase", marginBottom: 4 }}
      >
        Equipo Komfy
      </div>
      <p style={{ fontSize: 12.5, color: "#6B6359", margin: "0 0 12px", lineHeight: 1.5 }}>
        Si trabajás en Komfy, entrá con tu Komfy ID.
      </p>

      {!soportado ? (
        <p style={{ fontSize: 12.5, color: "#6B6359", margin: 0 }}>
          Este navegador no soporta cara o huella. Probá desde el celular.
        </p>
      ) : modo === "fuera" ? (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1C1C1C", marginBottom: 4 }}>🕗 Fuera de horario</div>
          <p style={{ fontSize: 13, color: "#6B6359", margin: 0, lineHeight: 1.5 }}>{aviso}</p>
          {link("← Volver", "entrar")}
        </div>
      ) : modo === "entrar" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            placeholder="Usuario (opcional)"
            autoCapitalize="none"
            autoComplete="off"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!cargando) entrar();
              }
            }}
            style={inputStyle}
          />
          <button type="button" onClick={entrar} disabled={cargando} style={botonEquipo(cargando)}>
            {cargando ? "Esperando…" : "Entrar con Komfy ID (cara o huella)"}
          </button>
          {errorBox}
          {link("Tengo un código para este dispositivo", "codigo")}
        </div>
      ) : (
        <form onSubmit={enrolar} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "#6B6359", margin: 0, lineHeight: 1.5 }}>
            Pedile el código a Mati. Dura 1 hora y sirve para activar todas tus apps de Komfy.
          </p>
          <input
            required
            placeholder="Tu usuario"
            autoCapitalize="none"
            autoComplete="off"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            style={inputStyle}
          />
          <input
            required
            placeholder="Código (000000-000000)"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            style={{ ...inputStyle, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: ".08em" }}
          />
          <button type="submit" disabled={cargando} style={botonEquipo(cargando)}>
            {cargando ? "Esperando…" : "Activar y entrar"}
          </button>
          {errorBox}
          {link("← Volver", "entrar")}
        </form>
      )}
    </section>
  );
}
