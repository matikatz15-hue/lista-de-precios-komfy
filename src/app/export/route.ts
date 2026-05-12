import { getPriceList } from "@/lib/data";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function formatAR(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeCSV(value: string, separator: string): string {
  if (value.includes(separator) || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const version = url.searchParams.get("version") ?? undefined;
  const preview = url.searchParams.get("preview") ?? undefined;

  const { lines, viewer, snapshot } = await getPriceList({
    previewClientId: preview,
    snapshotId: version,
  });

  // Semicolon separator works with es-AR locale Excel out of the box,
  // and avoids collision with the comma decimal separator.
  const SEP = ";";

  const hasAnyDiscount = lines.some((l) =>
    l.groups.some((g) => g.products.some((p) => p.discountPercent !== null && p.discountPercent !== 0))
  );

  const headers = [
    "Línea",
    "Grupo",
    "Producto",
    "SKU",
    "Color",
    "Medidas",
    "Bultos",
    "Precio",
  ];
  if (hasAnyDiscount) headers.push("Precio con descuento");

  const rows: string[][] = [headers];

  for (const line of lines) {
    for (const group of line.groups) {
      for (const p of group.products) {
        const row = [
          line.name,
          group.name,
          p.name,
          p.sku,
          p.color_name,
          p.dimensions,
          String(p.packages),
          formatAR(p.price),
        ];
        if (hasAnyDiscount) {
          const has = p.discountPercent !== null && p.discountPercent !== 0;
          row.push(has ? formatAR(p.finalPrice) : formatAR(p.price));
        }
        rows.push(row);
      }
    }
  }

  // BOM so Excel detects UTF-8 (tildes, ñ)
  const body = "﻿" + rows.map((r) => r.map((c) => escapeCSV(c, SEP)).join(SEP)).join("\r\n");

  // Filename hints what's inside
  const today = new Date().toISOString().slice(0, 10);
  let nameParts = ["lista-komfy"];
  if (snapshot) nameParts.push(snapshot.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  else nameParts.push(today);
  if (viewer.kind === "client") {
    nameParts.push((viewer.profile.full_name ?? viewer.profile.email).toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  } else if (viewer.kind === "preview") {
    nameParts.push((viewer.client.full_name ?? viewer.client.email).toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  }
  const filename = nameParts.filter(Boolean).join("-") + ".csv";

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
