// Huella / cara (passkeys WebAuthn). Solo servidor.
// La llave queda atada a este dominio: si la lista se muda de dominio, hay que volver a activarla.
export const RP_ID = process.env.PASSKEY_RP_ID ?? "lista-de-precios-komfy.vercel.app";
export const ORIGIN = `https://${RP_ID}`;
export const RP_NAME = "Komfy · Lista mayorista";
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export function nombreDispositivo(ua: string): string {
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  return "Dispositivo";
}
