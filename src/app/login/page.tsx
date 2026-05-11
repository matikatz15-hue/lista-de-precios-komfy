import { loginAction } from "./actions";

type Props = { searchParams: Promise<{ error?: string; redirect_to?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { error, redirect_to } = await searchParams;
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4EFE6",
        padding: 16,
        fontFamily: "var(--font-noto), system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "white",
          borderRadius: 12,
          boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 30px 60px -20px rgba(0,71,187,.18)",
          padding: 32,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".22em", color: "#FFA400", textTransform: "uppercase", marginBottom: 4 }}>
          Komfy
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1C1C1C", margin: "0 0 6px" }}>Iniciar sesión</h1>
        <p style={{ fontSize: 13, color: "#6B6359", margin: "0 0 22px" }}>
          Ingresá para ver tu lista con precios personalizados.
        </p>
        <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {redirect_to && <input type="hidden" name="redirect_to" value={redirect_to} />}
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label="Contraseña" name="password" type="password" required autoComplete="current-password" />
          {error && (
            <div style={{ fontSize: 13, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            style={{
              background: "#0047BB",
              color: "white",
              fontWeight: 700,
              padding: "11px 16px",
              borderRadius: 8,
              border: 0,
              cursor: "pointer",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          color: "#6B6359",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #d4d4d8",
          borderRadius: 8,
          fontSize: 14,
          outline: "none",
        }}
      />
    </div>
  );
}
