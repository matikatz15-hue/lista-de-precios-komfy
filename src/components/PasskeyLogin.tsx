"use client";

import { useEffect, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { ingresarConPasskey, opcionesIngreso } from "@/app/login/passkey-actions";

// Botón "Entrar con huella o cara" del login. Convive con la contraseña.
export function PasskeyLogin({ redirectTo }: { redirectTo?: string }) {
  const [soportado, setSoportado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const err = e as Error;
      // el usuario canceló el diálogo del sistema
      if (err.name === "NotAllowedError" || err.name === "AbortError") setError(null);
      else setError(err.message || "No se pudo entrar.");
      setCargando(false);
    }
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px", color: "#9ca3af", fontSize: 11 }}>
        <span style={{ flex: 1, height: 1, background: "#e4e4e7" }} />o<span style={{ flex: 1, height: 1, background: "#e4e4e7" }} />
      </div>
      <button
        type="button"
        onClick={entrar}
        disabled={cargando}
        style={{
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
        }}
      >
        {cargando ? "Verificando…" : "Entrar con huella o cara"}
      </button>
      {error && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px" }}>
          {error}
        </div>
      )}
      <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: "8px 0 0" }}>
        Para usarla, activala una vez después de entrar con tu contraseña.
      </p>
    </div>
  );
}
