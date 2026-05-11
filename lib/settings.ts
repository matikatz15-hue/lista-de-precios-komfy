import { db } from "@/lib/db";

const DEFAULTS: Record<string, string> = {
  vigencia: "11 · 03 · 26",
  contacto: "hola@komfy.com.ar",
  telefono: "+54 9 341 331-8965",
  web: "komfy.com.ar",
  version: "v3.1",
  periodo: "Marzo 2026",
  "intro-quote": "Diseño cómodo y accesible que transforma espacios.",
  "intro-p1": "¡Hola! Esta lista de precios fue creada como una guía clara y cuidada por Komfy para que puedas acceder a nuestras líneas de productos con precios mayoristas claros.",
  "intro-p2": "En Komfy creemos que el diseño cómodo y accesible transforma espacios. Diseñamos y fabricamos muebles fáciles de armar y pensados para adaptarse a distintos ambientes.",
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.settings.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  return map;
}

export async function setSetting(key: string, value: string) {
  return db.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
