import { createClient } from "@/lib/supabase/server";
import { ColorSwatch } from "@/components/ColorSwatch";
import { SubmitButton } from "@/components/SubmitButton";
import { formatPrice } from "@/lib/format";
import { resolverAction, guardarAction, recuperarAction, revisarWebAction } from "./actions";
import { requireEditor } from "@/lib/roles";

type Fila = {
  tn_variant_id: string;
  tn_product_id: string;
  sku: string | null;
  producto: string;
  producto_web: string | null;
  color_name: string;
  color_hex: string;
  color_hex_secondary: string | null;
  imagen: string | null;
  imagen_producto: string | null;
  medidas: string | null;
  bultos: number | null;
  linea_slug: string | null;
  precio: number | null;
  precio_origen: string | null;
  tipo: "producto_nuevo" | "color_nuevo";
  grupo_id: string | null;
  estado: string;
  editado: boolean;
  orden: number;
  resuelto_at: string | null;
  resuelto_por: string | null;
};

type PageProps = { searchParams: Promise<{ saved?: string; error?: string }> };

export const dynamic = "force-dynamic";

export default async function NuevosPage({ searchParams }: PageProps) {
  const { saved, error } = await searchParams;
  const supabase = await createClient();
  const [pendRes, linesRes, settingsRes, prodRes] = await Promise.all([
    supabase.from("web_pendientes").select("*").in("estado", ["pendiente", "descartado"]).order("tn_product_id").order("orden"),
    supabase.from("lines").select("slug, name").order("sort_order"),
    supabase.from("settings").select("web_sync_at, web_sync_resumen").eq("id", 1).single(),
    supabase.from("products").select("sku"),
  ]);
  const filas = (pendRes.data ?? []) as Fila[];
  const lineas = (linesRes.data ?? []) as { slug: string; name: string }[];
  const enLista = new Set(((prodRes.data ?? []) as { sku: string }[]).map((p) => p.sku));
  const syncAt = settingsRes.data?.web_sync_at as string | null;

  const pendientes = filas.filter((f) => f.estado === "pendiente");
  const descartados = filas.filter((f) => f.estado === "descartado");

  // SKUs repetidos dentro de la web
  const cuenta = new Map<string, number>();
  for (const f of pendientes) if (f.sku) cuenta.set(f.sku, (cuenta.get(f.sku) ?? 0) + 1);

  const porProducto = new Map<string, Fila[]>();
  for (const f of pendientes) {
    const arr = porProducto.get(f.tn_product_id) ?? [];
    arr.push(f);
    porProducto.set(f.tn_product_id, arr);
  }
  // primero lo que se puede aceptar, después lo que está incompleto
  const productos = [...porProducto.values()].sort((a, b) => {
    const listo = (x: Fila[]) => x.some((f) => f.sku && f.precio);
    return Number(listo(b)) - Number(listo(a)) || a[0].producto.localeCompare(b[0].producto);
  });

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Nuevos de la web</h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            Productos y colores que están publicados en komfy.com.ar y todavía no en la lista mayorista.
            Nada se publica solo: revisá, corregí si hace falta y aceptá. El precio viene del Vinculador.
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            La web se revisa sola cada 3 horas.
            {syncAt ? ` Última revisión: ${new Date(syncAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", dateStyle: "short", timeStyle: "short" })}.` : ""}
          </p>
        </div>
        <form action={revisarWebAction}>
          <SubmitButton
            pendingText="Revisando…"
            className="whitespace-nowrap px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700"
          >
            Revisar la web ahora
          </SubmitButton>
        </form>
      </header>

      {saved && <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">{saved}</div>}
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">{error}</div>}

      {productos.length === 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center text-zinc-500">
          No hay nada pendiente. Todo lo de la web ya está en la lista (o lo descartaste).
        </div>
      )}

      <div className="flex flex-col gap-5">
        {productos.map((vars) => {
          const f0 = vars[0];
          const esColorNuevo = f0.tipo === "color_nuevo";
          return (
            <form key={f0.tn_product_id} action={resolverAction} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <input type="hidden" name="tn_product_id" value={f0.tn_product_id} />
              <div className="flex gap-4 p-4 border-b border-zinc-100">
                {f0.imagen_producto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f0.imagen_producto} alt="" className="w-24 h-24 rounded-lg object-cover bg-zinc-100 shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-zinc-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${esColorNuevo ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}`}>
                      {esColorNuevo ? `Color nuevo en ${f0.producto}` : "Producto nuevo"}
                    </span>
                    {f0.producto_web && <span className="text-xs text-zinc-400 truncate">En la web: {f0.producto_web}</span>}
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <label className="col-span-4 text-xs text-zinc-500">
                      Nombre
                      <input name="producto" defaultValue={f0.producto} readOnly={esColorNuevo}
                        className={`mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 ${esColorNuevo ? "bg-zinc-50" : ""}`} />
                    </label>
                    <label className="col-span-2 text-xs text-zinc-500">
                      Línea
                      <select name="linea_slug" defaultValue={f0.linea_slug ?? ""} disabled={esColorNuevo}
                        className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 bg-white disabled:bg-zinc-50">
                        <option value="">Elegir…</option>
                        {lineas.map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
                      </select>
                      {esColorNuevo && <input type="hidden" name="linea_slug" value={f0.linea_slug ?? ""} />}
                    </label>
                    <label className="col-span-4 text-xs text-zinc-500">
                      Medidas del producto
                      <input name="medidas" defaultValue={f0.medidas ?? ""} placeholder="prof × ancho × alto cm"
                        className={`mt-1 w-full rounded-md border px-2 py-1.5 text-sm text-zinc-900 ${f0.medidas ? "border-zinc-300" : "border-red-300 bg-red-50"}`} />
                    </label>
                    <label className="col-span-2 text-xs text-zinc-500">
                      Bultos
                      <input name="bultos" type="number" min={1} defaultValue={f0.bultos ?? ""}
                        className={`mt-1 w-full rounded-md border px-2 py-1.5 text-sm text-zinc-900 ${f0.bultos ? "border-zinc-300" : "border-red-300 bg-red-50"}`} />
                    </label>
                  </div>
                </div>
              </div>

              <table className="w-full text-sm">
                <tbody>
                  {vars.map((v) => {
                    const avisos: string[] = [];
                    if (!v.sku) avisos.push("falta el código en la web");
                    else if ((cuenta.get(v.sku) ?? 0) > 1) avisos.push("código repetido en la web");
                    else if (enLista.has(v.sku)) avisos.push("el código ya está en la lista");
                    if (!v.precio) avisos.push("sin precio en el Vinculador");
                    const ok = avisos.length === 0;
                    return (
                      <tr key={v.tn_variant_id} className="border-b border-zinc-50 last:border-0">
                        <td className="pl-4 pr-2 py-2 w-8">
                          <input type="checkbox" name="variante" value={v.tn_variant_id} defaultChecked={ok} className="h-4 w-4 accent-zinc-900" />
                        </td>
                        <td className="px-2 py-2 w-12">
                          {v.imagen ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.imagen} alt="" className="w-9 h-9 rounded object-cover bg-zinc-100" />
                          ) : null}
                        </td>
                        <td className="px-2 py-2">
                          <span className="inline-flex items-center gap-2">
                            <ColorSwatch hex={v.color_hex} hexSecondary={v.color_hex_secondary} name={v.color_name} size={12} className="rounded-full border border-zinc-300" />
                            {v.color_name || <span className="text-zinc-400">sin color</span>}
                          </span>
                        </td>
                        <td className="px-2 py-2 font-mono text-xs text-zinc-600">{v.sku ?? "—"}</td>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {v.precio ? (
                            <>
                              ${formatPrice(Number(v.precio))}
                              <span className="ml-1 text-[10px] uppercase text-zinc-400">{v.precio_origen === "metka" ? "metka" : "vinc."}</span>
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2 text-xs text-right">
                          {ok ? <span className="text-emerald-700">listo</span> : <span className="text-amber-700">{avisos.join(" · ")}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-50 border-t border-zinc-100">
                <SubmitButton pendingText="Publicando…" className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700">
                  Aceptar tildados
                </SubmitButton>
                <SubmitButton formAction={guardarAction} pendingText="Guardando…" className="px-4 py-2 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-100">
                  Guardar cambios
                </SubmitButton>
                <SubmitButton formAction={descartarAction} pendingText="Descartando…" className="ml-auto px-4 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-700 hover:bg-red-50">
                  Descartar tildados
                </SubmitButton>
              </div>
            </form>
          );
        })}
      </div>

      {descartados.length > 0 && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-600">
            Descartados ({descartados.length}) — no se venden por mayor
          </summary>
          <form action={recuperarAction} className="mt-3 bg-white rounded-xl border border-zinc-200">
            <table className="w-full text-sm">
              <tbody>
                {descartados.map((v) => (
                  <tr key={v.tn_variant_id} className="border-b border-zinc-50 last:border-0">
                    <td className="pl-4 pr-2 py-2 w-8"><input type="checkbox" name="variante" value={v.tn_variant_id} className="h-4 w-4" /></td>
                    <td className="px-2 py-2">{v.producto}</td>
                    <td className="px-2 py-2">{v.color_name}</td>
                    <td className="px-2 py-2 font-mono text-xs text-zinc-500">{v.sku ?? "—"}</td>
                    <td className="px-4 py-2 text-xs text-zinc-400 text-right">{v.resuelto_por}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100">
              <SubmitButton pendingText="Recuperando…" className="px-4 py-2 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-100">
                Volver a pendientes
              </SubmitButton>
            </div>
          </form>
        </details>
      )}
    </div>
  );
}

async function descartarAction(formData: FormData) {
  "use server";
  await requireEditor();
  formData.set("accion", "descartar");
  return resolverAction(formData);
}
