"use client";

import { useEffect, useState } from "react";
import { startRegistration, type PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { activarConSesion, opcionesActivacionSesion } from "@/app/login/passkey-actions";
import { leerBio, marcarBio } from "@/lib/bio-dispositivo";

// Pop-up después de entrar con email y contraseña: ofrece activar huella o cara en ESTE
// dispositivo, sin código (la contraseña ya probó quién es). Solo si el login con contraseña
// lo pidió (cookie kf_bio_ofrecer), el dispositivo tiene lector biométrico y no está activado.

const COOKIE = "kf_bio_ofrecer";

function hayCookie() {
  return document.cookie.split("; ").some((c) => c === `${COOKIE}=1`);
}
function borrarCookie() {
  document.cookie = `${COOKIE}=; Max-Age=0; path=/; secure; samesite=lax`;
}

type Opciones = { id: string; options: PublicKeyCredentialCreationOptionsJSON };
type Estado = "oculto" | "pregunta" | "activando" | "listo";

export function OfrecerBiometria() {
  const [estado, setEstado] = useState<Estado>("oculto");
  const [opciones, setOpciones] = useState<Opciones | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hayCookie()) return;
    borrarCookie(); // se ofrece una vez por login
    if (leerBio() === "activado") return;
    const pkc = window.PublicKeyCredential;
    if (!pkc?.isUserVerifyingPlatformAuthenticatorAvailable) return;
    let vivo = true;
    (async () => {
      const hayLector = await pkc.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
      if (!hayLector || !vivo) return;
      // Pedimos las opciones antes de que toque «Activar»: así el pedido de huella sale
      // directo del toque (Safari lo exige).
      const o = await opcionesActivacionSesion().catch(() => null);
      if (!o || "error" in o || !vivo) return;
      setOpciones(o);
      setEstado("pregunta");
    })();
    return () => {
      vivo = false;
    };
  }, []);

  if (estado === "oculto") return null;

  async function activar() {
    setError(null);
    setEstado("activando");
    try {
      let o = opciones;
      if (!o) {
        const n = await opcionesActivacionSesion();
        if ("error" in n) throw new Error(n.error);
        o = n;
      }
      const resp = await startRegistration({ optionsJSON: o.options });
      setOpciones(null); // ese desafío ya se usó
      const r = await activarConSesion(o.id, resp);
      if ("error" in r) throw new Error(r.error);
      marcarBio("activado");
      setEstado("listo");
    } catch (e) {
      const n = (e as Error)?.name;
      if (n === "InvalidStateError") {
        // la llave ya estaba en este dispositivo
        marcarBio("activado");
        setEstado("listo");
        return;
      }
      setOpciones(null);
      setError(n === "NotAllowedError" || n === "AbortError" ? "No se completó. Podés intentar de nuevo." : (e as Error).message || "No se pudo activar.");
      setEstado("pregunta");
    }
  }

  const cerrar = () => setEstado("oculto");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bio-titulo"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(28,28,28,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "var(--font-noto), system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "white",
          borderRadius: 12,
          boxShadow: "0 30px 60px -20px rgba(0,71,187,.35)",
          padding: 28,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 12 }} aria-hidden>
          {estado === "listo" ? "✅" : "🔐"}
        </div>
        {estado === "listo" ? (
          <>
            <h2 id="bio-titulo" style={{ fontSize: 20, fontWeight: 800, color: "#1C1C1C", margin: "0 0 8px" }}>
              ¡Listo!
            </h2>
            <p style={{ fontSize: 14, color: "#6B6359", margin: "0 0 20px", lineHeight: 1.5 }}>
              La próxima vez tocá <b>«Entrar con huella o cara»</b> y no vas a necesitar la contraseña.
            </p>
            <button type="button" onClick={cerrar} style={botonPrimario(false)}>
              Seguir
            </button>
          </>
        ) : (
          <>
            <h2 id="bio-titulo" style={{ fontSize: 20, fontWeight: 800, color: "#1C1C1C", margin: "0 0 8px" }}>
              ¿Entrás más fácil la próxima?
            </h2>
            <p style={{ fontSize: 14, color: "#6B6359", margin: "0 0 20px", lineHeight: 1.5 }}>
              Guardá tu huella o tu cara en este dispositivo y entrá sin escribir la contraseña.
            </p>
            <button type="button" onClick={activar} disabled={estado === "activando"} style={botonPrimario(estado === "activando")}>
              {estado === "activando" ? "Esperando…" : "Activar huella o cara"}
            </button>
            {error && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px" }}>
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={cerrar}
              disabled={estado === "activando"}
              style={{ display: "block", margin: "14px auto 0", background: "none", border: 0, color: "#6B6359", fontSize: 13, textDecoration: "underline", cursor: "pointer", fontFamily: "inherit" }}
            >
              Ahora no
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function botonPrimario(cargando: boolean): React.CSSProperties {
  return {
    width: "100%",
    background: "#0047BB",
    color: "white",
    fontWeight: 700,
    padding: "12px 16px",
    borderRadius: 8,
    border: 0,
    cursor: cargando ? "wait" : "pointer",
    opacity: cargando ? 0.7 : 1,
    fontSize: 15,
    fontFamily: "inherit",
  };
}
