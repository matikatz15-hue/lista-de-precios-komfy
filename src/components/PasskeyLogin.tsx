"use client";

import { useEffect, useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import {
  activarConCodigo,
  ingresarConPasskey,
  opcionesActivacion,
  opcionesIngreso,
} from "@/app/login/passkey-actions";

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

function cancelado(e: unknown) {
  const n = (e as Error)?.name;
  return n === "NotAllowedError" || n === "AbortError";
}

// "Entrar con huella o cara" + "Tengo un código para este dispositivo". Convive con la contraseña.
export function PasskeyLogin({ redirectTo }: { redirectTo?: string }) {
  const [soportado, setSoportado] = useState(false);
  const [modo, setModo] = useState<"entrar" | "codigo">("entrar");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    setSoportado(typeof window !== "undefined" && !!window.PublicKeyCredential);
  }, []);

  if (!soportado) return null;

  async function entrar() {
    setError(null);
    setCargando(true);
    try {
      const o = await opcionesIngreso();
      if ("error" in o) throw new Error(o.error);
      const resp = await startAuthentication({ optionsJSON: o.options });
      const r = await ingresarConPasskey(o.id, resp, redirectTo ?? "");
      if ("error" in r) throw new Error(r.error);
      window.location.assign(r.destino);
    } catch (e) {
      if (!cancelado(e)) setError((e as Error).message || "No se pudo entrar.");
      setCargando(false);
    }
  }

  async function activar(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const o = await opcionesActivacion(email, codigo);
      if ("error" in o) throw new Error(o.error);
      const resp = await startRegistration({ optionsJSON: o.options });
      const r = await activarConCodigo(o.id, resp, email, codigo, redirectTo ?? "");
      if ("error" in r) throw new Error(r.error);
      window.location.assign(r.destino);
    } catch (e) {
      if ((e as Error)?.name === "InvalidStateError") setError("Este dispositivo ya está activado: usá «Entrar con huella o cara».");
      else if (!cancelado(e)) setError((e as Error).message || "No se pudo activar.");
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
          {link("Tengo un código para este dispositivo", "codigo")}
        </>
      ) : (
        <form onSubmit={activar} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "#6B6359", margin: 0 }}>
            Pedile el código a Komfy. Dura 1 hora y se usa una sola vez. Después entrás con tu huella o tu cara.
          </p>
          <input
            type="email"
            required
            placeholder="Tu email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {link("Volver", "entrar")}
        </form>
      )}
    </div>
  );
}
