import Link from "next/link";
import type { Viewer, PriceSnapshot } from "@/lib/types";
import { logoutAction } from "@/app/login/actions";
import { VersionSelector } from "@/components/VersionSelector";

type Props = {
  viewer: Viewer;
  snapshot?: PriceSnapshot | null;
  availableSnapshots?: PriceSnapshot[];
};

const MEDIA_FOLDER_URL =
  "https://drive.google.com/drive/folders/1CTx0z4gTwR7pXZq6nae9WQLK80nxDn8K?usp=sharing";

function exportHref(snapshotId?: string | null, previewClientId?: string | null) {
  const params = new URLSearchParams();
  if (snapshotId) params.set("version", snapshotId);
  if (previewClientId) params.set("preview", previewClientId);
  const qs = params.toString();
  return qs ? `/export?${qs}` : "/export";
}

const downloadPillStyleLight: React.CSSProperties = {
  background: "rgba(255,255,255,.95)",
  color: "#0047BB",
  padding: "7px 12px",
  borderRadius: 999,
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 700,
  border: "1px solid rgba(0,0,0,.08)",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const downloadPillStyleDark: React.CSSProperties = {
  background: "rgba(255,255,255,.15)",
  color: "white",
  padding: "5px 12px",
  borderRadius: 999,
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

export function PublicHeader({ viewer, snapshot, availableSnapshots = [] }: Props) {
  const canSeeVersions =
    viewer.kind !== "public" && availableSnapshots.length > 0;
  const isLoggedIn = viewer.kind !== "public";

  // When a snapshot is active, render a full sticky bar that contains BOTH
  // the indicator and the controls — otherwise the absolute-positioned
  // controls get hidden behind the bar.
  if (snapshot) {
    return (
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#1C1C1C",
          color: "white",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          fontFamily: "var(--font-noto), sans-serif",
          fontSize: 12,
          fontWeight: 700,
          boxShadow: "0 1px 4px rgba(0,0,0,.2)",
        }}
      >
        <span style={{ minWidth: 0 }}>
          📅 Viendo versión histórica <strong>{snapshot.name}</strong>
          {snapshot.effective_date && (
            <span style={{ opacity: 0.7 }}> · {snapshot.effective_date}</span>
          )}
        </span>
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {isLoggedIn && (
            <a
              href={MEDIA_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={downloadPillStyleDark}
            >
              📷 Multimedia
            </a>
          )}
          <a href={exportHref(snapshot.id)} style={downloadPillStyleDark} download>
            ↓ CSV
          </a>
          {canSeeVersions && (
            <VersionSelector snapshots={availableSnapshots} current={snapshot.id} />
          )}
          {viewer.kind === "admin" && (
            <Link
              href="/admin"
              style={{
                background: "rgba(255,255,255,.15)",
                color: "white",
                padding: "5px 12px",
                borderRadius: 999,
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              ← Admin
            </Link>
          )}
          {isLoggedIn && (
            <form action={logoutAction} style={{ display: "inline-flex" }}>
              <button
                type="submit"
                style={{
                  background: "rgba(255,255,255,.15)",
                  color: "white",
                  padding: "5px 12px",
                  borderRadius: 999,
                  border: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Salir
              </button>
            </form>
          )}
        </span>
      </div>
    );
  }

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
          flexWrap: "wrap",
          justifyContent: "flex-end",
          fontFamily: "var(--font-noto), sans-serif",
        }}
      >
        {isLoggedIn && (
          <a
            href={MEDIA_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={downloadPillStyleLight}
          >
            📷 Multimedia
          </a>
        )}
        <a href={exportHref()} style={downloadPillStyleLight} download>
          ↓ CSV
        </a>
        {canSeeVersions && (
          <VersionSelector snapshots={availableSnapshots} current={null} />
        )}
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
                fontFamily: "inherit",
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
