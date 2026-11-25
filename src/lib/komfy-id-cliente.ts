// Komfy ID desde el navegador (equipo Komfy). Mismo protocolo que el resto de las apps
// (ver stock/index.html en komfy-data): login_fin / registro_inicio / registro_fin → token
// (x-kid-token) → sesion_lista. Las llaves de Komfy ID son aparte de las de clientes (lp_passkeys),
// pero viven en el mismo dominio, así que el mismo botón de huella o cara sirve para las dos.

const KID_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/komfy-id`;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export class KidError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = any;

export async function kidApi(action: string, body?: object, token?: string): Promise<Json> {
  const h: Record<string, string> = {
    apikey: ANON,
    Authorization: `Bearer ${ANON}`,
    "Content-Type": "application/json",
  };
  if (token) h["x-kid-token"] = token;
  const r = await fetch(`${KID_URL}?action=${encodeURIComponent(action)}`, {
    method: body ? "POST" : "GET",
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new KidError(d.error || `HTTP ${r.status}`, d.code, r.status);
  return d;
}

export function nombreDisp(): string {
  const u = navigator.userAgent;
  if (/iPhone/.test(u)) return "iPhone";
  if (/iPad/.test(u)) return "iPad";
  if (/Android/.test(u)) return "Android";
  if (/Mac/.test(u)) return "Mac";
  if (/Windows/.test(u)) return "Windows";
  return "Dispositivo";
}
