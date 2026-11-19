// Huella / cara (passkeys WebAuthn). Solo servidor.
// La llave queda atada a este dominio: si la lista se muda de dominio, hay que volver a activarla.
export const RP_ID = process.env.PASSKEY_RP_ID ?? "lista-de-precios-komfy.vercel.app";
export const ORIGIN = `https://${RP_ID}`;
export const RP_NAME = "Komfy · Lista mayorista";
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// Código de activación (como en bonos): lo genera el admin, dura 1 hora, sirve una vez.
export const CODIGO_MIN = 60;
export const CODIGO_MAX_INTENTOS = 5;

export function nombreDispositivo(ua: string): string {
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  return "Dispositivo";
}

export function nuevoCodigo(): string {
  const n = new Uint32Array(2);
  crypto.getRandomValues(n);
  return String(n[0] % 1000000).padStart(6, "0") + "-" + String(n[1] % 1000000).padStart(6, "0");
}

// Normaliza lo que tipea la persona: solo dígitos, con el guion en el medio.
export function normalizarCodigo(s: string): string {
  const d = s.replace(/\D/g, "");
  return d.length === 12 ? `${d.slice(0, 6)}-${d.slice(6)}` : d;
}

export async function hashCodigo(codigo: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codigo));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function igualSeguro(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
