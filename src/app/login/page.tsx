import { loginAction } from "./actions";
import { PasswordInput } from "@/components/PasswordInput";

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
        <form
          action={loginAction}
          autoComplete="on"
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {redirect_to && <input type="hidden" name="redirect_to" value={redirect_to} />}
          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d4d4d8",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
          <div>
            <FieldLabel>Contraseña</FieldLabel>
            <PasswordInput id="login-password" name="password" required autoComplete="current-password" />
          </div>
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
          <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: "8px 0 0" }}>
            El navegador te va a ofrecer guardar tu usuario y contraseña la primera vez.
          </p>
        </form>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </label>
  );
}
