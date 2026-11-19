"use client";

import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { opcionesRegistro, registrarPasskey } from "@/app/login/passkey-actions";

const POSPONER_DIAS = 30;

// Tarjetita que aparece después de entrar con contraseña: "¿Activás huella/cara en este dispositivo?"
// Se recuerda por dispositivo (localStorage) — cada celu/compu se activa aparte.
export function PasskeyOffer({ userId }: { userId: string }) {
  const clave = `kf-pk-${userId}`;
  const [visible, setVisible] = useState(false);
  const [estado, setEstado] = useState<"idle" | "cargando" | "listo">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const guardado = localStorage.getItem(clave);
        if (guardado === "activo") return;
        if (guardado && Date.now() - Number(guardado) < POSPONER_DIAS * 864e5) return;
      } catch {
        /* sin storage: igual ofrecemos */
      }
      if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return;
      const ok = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
      if (vivo && ok) setVisible(true);
    })();
    return () => {
      vivo = false;
    };
  }, [clave]);

  function recordar(valor: string) {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      /* nada */
    }
  }

  async function activar() {
    setError(null);
    setEstado("cargando");
    try {
      const o = await opcionesRegistro();
      if ("error" in o) throw new Error(o.error);
      const resp = await startRegistration({ optionsJSON: o.options });
      const r = await registrarPasskey(o.id, resp);
      if ("error" in r) throw new Error(r.error);
      recordar("activo");
      setEstado("listo");
      setTimeout(() => setVisible(false), 3500);
    } catch (e) {
      const err = e as Error;
      if (err.name === "InvalidStateError") {
        // este dispositivo ya tenía la llave
        recordar("activo");
        setEstado("listo");
        setTimeout(() => setVisible(false), 3500);
        return;
      }
      if (err.name !== "NotAllowedError" && err.name !== "AbortError") setError(err.message || "No se pudo activar.");
      setEstado("idle");
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Activar huella o cara"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        left: "auto",
        zIndex: 60,
        width: "min(340px, calc(100vw - 32px))",
        background: "white",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 20px 40px -12px rgba(0,71,187,.28)",
        border: "1px solid rgba(0,0,0,.06)",
        padding: 16,
        fontFamily: "var(--font-noto), system-ui, sans-serif",
        color: "#1C1C1C",
      }}
    >
      {estado === "listo" ? (
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0047BB" }}>
          Listo. La próxima vez tocá «Entrar con huella o cara».
        </div>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Entrá más rápido</div>
          <p style={{ fontSize: 13, color: "#6B6359", margin: "0 0 12px" }}>
            Activá tu huella o tu cara en este dispositivo y no vas a tener que escribir la contraseña.
          </p>
          {error && <div style={{ fontSize: 12, color: "#b91c1c", marginBottom: 10 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={activar}
              disabled={estado === "cargando"}
              style={{
                flex: 1,
                background: "#0047BB",
                color: "white",
                fontWeight: 700,
                padding: "9px 12px",
                borderRadius: 8,
                border: 0,
                fontSize: 13,
                cursor: estado === "cargando" ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {estado === "cargando" ? "Activando…" : "Activar"}
            </button>
            <button
              type="button"
              onClick={() => {
                recordar(String(Date.now()));
                setVisible(false);
              }}
              style={{
                background: "transparent",
                color: "#6B6359",
                fontWeight: 600,
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid #e4e4e7",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Ahora no
            </button>
          </div>
        </>
      )}
    </div>
  );
}
