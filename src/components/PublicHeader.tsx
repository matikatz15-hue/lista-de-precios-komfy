import Link from "next/link";
import type { Viewer } from "@/lib/types";
import { logoutAction } from "@/app/login/actions";

export function PublicHeader({ viewer }: { viewer: Viewer }) {
  return (
    <>
      {viewer.kind === "preview" && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "#FFA400",
            color: "#1C1C1C",
            padding: "10px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "var(--font-noto), sans-serif",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 1px 4px rgba(0,0,0,.1)",
          }}
        >
          <span>
            👁 Viendo lista como{" "}
            <strong>{viewer.client.full_name || viewer.client.email}</strong> · precios con sus
            descuentos
          </span>
          <Link
            href="/"
            style={{
              background: "#1C1C1C",
              color: "white",
              padding: "5px 12px",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 12,
            }}
          >
            Salir del preview ✕
          </Link>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 12,
          right: 14,
          zIndex: 40,
          display: "flex",
          gap: 8,
          alignItems: "center",
          fontFamily: "var(--font-noto), sans-serif",
        }}
      >
        {viewer.kind === "public" && (
          <Link
            href="/login"
            style={{
              background: "rgba(255,255,255,.95)",
              color: "#0047BB",
              padding: "7px 14px",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 12,
              fontWeight: 700,
              border: "1px solid rgba(255,255,255,.6)",
              backdropFilter: "blur(6px)",
            }}
          >
            Iniciar sesión
          </Link>
        )}

        {viewer.kind === "client" && (
          <UserPill
            label={`Hola ${viewer.profile.full_name?.split(" ")[0] || "cliente"}`}
            secondary="con tus precios"
          />
        )}

        {viewer.kind === "admin" && (
          <>
            <Link
              href="/admin"
              style={{
                background: "rgba(28,28,28,.9)",
                color: "white",
                padding: "7px 14px",
                borderRadius: 999,
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ← Panel admin
            </Link>
          </>
        )}

        {viewer.kind !== "public" && viewer.kind !== "preview" && (
          <form action={logoutAction} style={{ display: "inline-flex" }}>
            <button
              type="submit"
              style={{
                background: "rgba(255,255,255,.85)",
                color: "#1C1C1C",
                padding: "7px 12px",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,.08)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Salir
            </button>
          </form>
        )}
      </div>
    </>
  );
}

function UserPill({ label, secondary }: { label: string; secondary?: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.95)",
        color: "#1C1C1C",
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        border: "1px solid rgba(0,0,0,.08)",
        backdropFilter: "blur(6px)",
      }}
    >
      {label}
      {secondary && (
        <span style={{ marginLeft: 6, color: "#FFA400", fontWeight: 700 }}>· {secondary}</span>
      )}
    </div>
  );
}
