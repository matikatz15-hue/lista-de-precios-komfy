"use client";

import { useState, useSyncExternalStore } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import {
  activarConCodigo,
  ingresarConPasskey,
  opcionesActivacion,
  opcionesIngreso,
} from "@/app/login/passkey-actions";
import { entrarEquipo } from "@/app/login/kid-actions";
import { KidError, kidApi, nombreDisp } from "@/lib/komfy-id-cliente";
import { marcarBio } from "@/lib/bio-dispositivo";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d4d4d8",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
};

const botonSecundario = (cargando: boolean): React.CSSProperties => ({
  width: "100%",
  background: "white",
  color: "#0047BB",
  fontWeight: 700,
  padding: "11px 16px",
  borderRadius: 8,
  border: "1.5px solid #0047BB",
  cursor: cargando ? "wait" : "pointer",
  opacity: cargando ? 0.7 : 1,
  fontSize: 14,
  fontFamily: "inherit",
});

const NO_RECONOCIDO = "No reconocimos este dispositivo. Pedile a Komfy un código para activarlo.";

function cancelado(e: unknown) {
  const n = (e as Error)?.name;
  return n === "NotAllowedError" || n === "AbortError";
}

const sinSuscripcion = () => () => {};
const hayWebAuthn = () => !!window.PublicKeyCredential;

// "Entrar con huella o cara" + "Tengo un código para este dispositivo". Convive con la contraseña.
// Un solo botón para clientes y equipo: la llave del cliente se verifica acá (lp_passkeys);
// si no es de cliente, se la pasamos a Komfy ID (equipo). Para activar: email = cliente, usuario = equipo.
export function PasskeyLogin({ redirectTo }: { redirectTo?: string }) {
  // En el servidor no se muestra; en el navegador se chequea de verdad.
  const soportado = useSyncExternalStore(sinSuscripcion, hayWebAuthn, () => false);
  const [modo, setModo] = useState<"entrar" | "codigo">("entrar");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [quien, setQuien] = useState("");
  const [codigo, setCodigo] = useState("");

  if (!soportado) return null;

  // Equipo: con el token de Komfy ID pedimos la sesión de la lista y la abrimos en el servidor.
  async function abrirSesionEquipo(token: string) {
    const s = await kidApi("sesion_lista", {}, token);
    if (!s?.token_hash) throw new Error("No se pudo abrir la sesión.");
    const r = await entrarEquipo(s.token_hash, s.email ?? "", redirectTo ?? "");
    if ("error" in r) throw new Error(r.error);
    window.location.assign(r.destino);
  }

  function mostrarError(e: unknown, porDefecto: string) {
    if (cancelado(e)) return;
    const err = e as KidError;
    if (err?.name === "InvalidStateError") setError("Este dispositivo ya está activado: usá «Entrar con huella o cara».");
    else if (err?.code === "fuera_horario") setAviso(err.message);
    else if (err?.message === "Dispositivo no reconocido") setError(NO_RECONOCIDO);
    else setError(err?.message || porDefecto);
  }

  // Lo que hace el botón (también se usa al terminar de activar a alguien del equipo).
  async function ingresar() {
    const o = await opcionesIngreso();
    if ("error" in o) throw new Error(o.error);
    const resp = await startAuthentication({ optionsJSON: o.options });
    const r = await ingresarConPasskey(o.id, resp, redirectTo ?? "");
    if ("error" in r) throw new Error(r.error);
    if ("equipo" in r) {
      // No es llave de cliente: que la verifique Komfy ID.
      const d = await kidApi("login_fin", { ...resp, usuario: null });
      if (!d.token) throw new Error("No se pudo entrar.");
      marcarBio("activado");
      await abrirSesionEquipo(d.token);
      return;
    }
    marcarBio("activado");
    window.location.assign(r.destino);
  }

  async function entrar() {
    setError(null);
    setAviso(null);
    setCargando(true);
    try {
      await ingresar();
    } catch (e) {
      mostrarError(e, "No se pudo entrar.");
      setCargando(false);
    }
  }

  async function activarCliente(email: string) {
    const o = await opcionesActivacion(email, codigo);
    if ("error" in o) throw new Error(o.error);
    const resp = await startRegistration({ optionsJSON: o.options });
    const r = await activarConCodigo(o.id, resp, email, codigo, redirectTo ?? "");
    if ("error" in r) throw new Error(r.error);
    marcarBio("activado");
    window.location.assign(r.destino);
  }

  async function activarEquipo(usuario: string) {
    const base = { usuario, codigo: codigo.trim() };
    const o = await kidApi("registro_inicio", base);
    const resp = await startRegistration({
      optionsJSON: { ...o, authenticatorSelection: { ...(o.authenticatorSelection || {}), authenticatorAttachment: "platform" } },
    });
    const fin = await kidApi("registro_fin", { ...base, apodo: nombreDisp(), ...resp });
    marcarBio("activado");
    // Activado: si Komfy ID ya devolvió sesión la usamos; si no, entramos con la llave nueva.
    if (fin?.token) await abrirSesionEquipo(fin.token);
    else await ingresar();
  }

  async function activar(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setAviso(null);
    const q = quien.trim();
    if (!q || !codigo.trim()) {
      setError("Completá los dos campos.");
      return;
    }
    setCargando(true);
    try {
      if (q.includes("@")) await activarCliente(q);
      else await activarEquipo(q.toLowerCase());
    } catch (e) {
      mostrarError(e, "No se pudo activar.");
      setCargando(false);
    }
  }

  const errorBox = error && (
    <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px" }}>
      {error}
    </div>
  );

  const avisoBox = aviso && (
    <div style={{ marginTop: 10, fontSize: 13, color: "#6B6359", background: "#F4EFE6", border: "1px solid #e4dccd", borderRadius: 6, padding: "8px 12px", lineHeight: 1.5 }}>
      🕗 {aviso}
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
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px", color: "#9ca3af", fontSize: 11 }}>
        <span style={{ flex: 1, height: 1, background: "#e4e4e7" }} />o<span style={{ flex: 1, height: 1, background: "#e4e4e7" }} />
      </div>

      {modo === "entrar" ? (
        <>
          <button type="button" onClick={entrar} disabled={cargando} style={botonSecundario(cargando)}>
            {cargando ? "Verificando…" : "Entrar con huella o cara"}
          </button>
          {errorBox}
          {avisoBox}
          {link("Tengo un código para este dispositivo", "codigo")}
        </>
      ) : (
        <form onSubmit={activar} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "#6B6359", margin: 0 }}>
            Pedile el código a Komfy. Dura 1 hora y se usa una sola vez. Después entrás con tu huella o tu cara.
          </p>
          <input
            required
            placeholder="Tu email"
            autoCapitalize="none"
            autoComplete="username"
            value={quien}
            onChange={(e) => setQuien(e.target.value)}
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
          <button type="submit" disabled={cargando} style={botonSecundario(cargando)}>
            {cargando ? "Activando…" : "Activar huella o cara"}
          </button>
          {errorBox}
          {avisoBox}
          <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, textAlign: "center" }}>
            ¿Sos del equipo Komfy? Poné tu usuario de Komfy ID en vez del email.
          </p>
          {link("Volver", "entrar")}
        </form>
      )}
    </div>
  );
}
