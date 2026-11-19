"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidatePriceList } from "@/lib/cache";
import { motivoNoEditor } from "@/lib/roles";

type Pendiente = {
  tn_variant_id: string;
  tn_product_id: string;
  sku: string | null;
  producto: string;
  color_name: string;
  color_hex: string;
  color_hex_secondary: string | null;
  imagen: string | null;
  imagen_producto: string | null;
  medidas: string | null;
  bultos: number | null;
  linea_slug: string | null;
  precio: number | null;
  grupo_id: string | null;
  orden: number;
  estado: string;
};

function volver(msg: { saved?: string; error?: string }): never {
  const q = new URLSearchParams(msg as Record<string, string>).toString();
  redirect(`/admin/nuevos${q ? `?${q}` : ""}`);
}

// Todas las acciones de esta pantalla escriben: solo el admin (el equipo "viewer" solo mira).
async function quien() {
  const noEditor = await motivoNoEditor();
  if (noEditor) volver({ error: noEditor });
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, email: data.user?.email ?? "admin" };
}

// Aceptar / descartar los colores tildados de un producto de la web.
export async function resolverAction(formData: FormData) {
  const { supabase, email } = await quien();
  const accion = formData.get("accion") === "descartar" ? "descartar" : "aceptar";
  const tnProductId = String(formData.get("tn_product_id"));
  const ids = formData.getAll("variante").map(String);
  if (!ids.length) volver({ error: "No tildaste ningún color." });

  const producto = String(formData.get("producto") ?? "").trim();
  const lineaSlug = String(formData.get("linea_slug") ?? "").trim();
  const medidas = String(formData.get("medidas") ?? "").trim();
  const bultos = Number(formData.get("bultos") ?? 0);
  const ahora = new Date().toISOString();

  if (accion === "descartar") {
    const { error } = await supabase
      .from("web_pendientes")
      .update({ estado: "descartado", resuelto_at: ahora, resuelto_por: email })
      .in("tn_variant_id", ids)
      .eq("tn_product_id", tnProductId);
    if (error) volver({ error: error.message });
    revalidatePath("/admin", "layout");
    volver({ saved: `${ids.length} color${ids.length > 1 ? "es" : ""} descartado${ids.length > 1 ? "s" : ""}. No vuelven a aparecer.` });
  }

  // ---- aceptar ----
  const { data: filas, error: e1 } = await supabase
    .from("web_pendientes")
    .select("*")
    .in("tn_variant_id", ids)
    .eq("tn_product_id", tnProductId)
    .eq("estado", "pendiente");
  if (e1) volver({ error: e1.message });
  const elegidas = (filas ?? []) as Pendiente[];
  if (!elegidas.length) volver({ error: "Esos colores ya no están pendientes." });

  // validaciones: código, precio, SKU repetido, medidas, línea
  const problemas: string[] = [];
  const skus = elegidas.map((f) => f.sku).filter(Boolean) as string[];
  const { data: yaEstan } = skus.length
    ? await supabase.from("products").select("sku").in("sku", skus)
    : { data: [] as { sku: string }[] };
  const existentes = new Set((yaEstan ?? []).map((r) => r.sku));
  const vistos = new Set<string>();
  for (const f of elegidas) {
    const quienColor = f.color_name || f.tn_variant_id;
    if (!f.sku) problemas.push(`${quienColor}: falta el código en la web`);
    else if (vistos.has(f.sku)) problemas.push(`${quienColor}: el código ${f.sku} está repetido en la web`);
    else if (existentes.has(f.sku)) problemas.push(`${quienColor}: el código ${f.sku} ya está en la lista`);
    if (!f.precio) problemas.push(`${quienColor}: sin precio en el Vinculador`);
    if (f.sku) vistos.add(f.sku);
  }
  if (!medidas) problemas.push("faltan las medidas del producto");
  if (!producto) problemas.push("falta el nombre");
  if (!(bultos >= 1)) problemas.push("los bultos tienen que ser 1 o más");
  if (problemas.length) volver({ error: `No se aceptó: ${problemas.join(" · ")}` });

  // grupo: el que ya existe (color nuevo) o uno nuevo en la línea elegida
  let grupoId = elegidas[0].grupo_id;
  if (!grupoId) {
    const { data: linea } = await supabase.from("lines").select("id").eq("slug", lineaSlug).single();
    if (!linea) volver({ error: "Elegí la línea del producto." });
    const { data: ultimo } = await supabase
      .from("product_groups")
      .select("sort_order")
      .eq("line_id", linea!.id)
      .order("sort_order", { ascending: false })
      .limit(1);
    const { data: g, error: e2 } = await supabase
      .from("product_groups")
      .insert({
        line_id: linea!.id,
        name: producto,
        base_dimensions: medidas,
        meta_label: `${elegidas.length} terminaci${elegidas.length > 1 ? "ones" : "ón"}`,
        thumbnail_path: elegidas[0].imagen_producto,
        tn_product_id: tnProductId,
        sort_order: (ultimo?.[0]?.sort_order ?? 0) + 1,
      })
      .select("id")
      .single();
    if (e2 || !g) volver({ error: e2?.message ?? "No se pudo crear el producto" });
    grupoId = g!.id;
  }

  const { data: hermanos } = await supabase
    .from("products")
    .select("sort_order, name")
    .eq("product_group_id", grupoId!)
    .order("sort_order", { ascending: false });
  let orden = (hermanos?.[0]?.sort_order ?? -1) + 1;
  const nombreFila = hermanos?.length ? hermanos[hermanos.length - 1].name : producto;

  const { error: e3 } = await supabase.from("products").insert(
    elegidas
      .sort((a, b) => a.orden - b.orden)
      .map((f) => ({
        product_group_id: grupoId,
        name: nombreFila,
        sku: f.sku,
        color_name: f.color_name,
        color_hex: f.color_hex,
        color_hex_secondary: f.color_hex_secondary,
        dimensions: medidas,
        packages: bultos,
        price: f.precio,
        sort_order: orden++,
        active: true,
        image_url: f.imagen,
        tn_variant_id: f.tn_variant_id,
      }))
  );
  if (e3) volver({ error: e3.code === "23505" ? "Algún código ya está en la lista." : e3.message });

  // contador de terminaciones del grupo, si tiene el formato estándar
  const { data: grupo } = await supabase.from("product_groups").select("meta_label").eq("id", grupoId!).single();
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("product_group_id", grupoId!).eq("active", true);
  if (grupo?.meta_label && /^\d+\s+terminaci/i.test(grupo.meta_label) && count) {
    await supabase.from("product_groups").update({ meta_label: `${count} terminaci${count > 1 ? "ones" : "ón"}` }).eq("id", grupoId!);
  }

  await supabase
    .from("web_pendientes")
    .update({ estado: "aceptado", resuelto_at: ahora, resuelto_por: email })
    .in("tn_variant_id", elegidas.map((f) => f.tn_variant_id));

  invalidatePriceList();
  revalidatePath("/admin", "layout");
  volver({ saved: `${producto}: ${elegidas.length} color${elegidas.length > 1 ? "es" : ""} publicado${elegidas.length > 1 ? "s" : ""} en la lista.` });
}

// Guardar correcciones (nombre, línea, medidas, bultos) sin aceptar todavía.
export async function guardarAction(formData: FormData) {
  const { supabase } = await quien();
  const tnProductId = String(formData.get("tn_product_id"));
  const bultos = Number(formData.get("bultos") ?? 0);
  const { error } = await supabase
    .from("web_pendientes")
    .update({
      producto: String(formData.get("producto") ?? "").trim(),
      linea_slug: String(formData.get("linea_slug") ?? "").trim() || null,
      medidas: String(formData.get("medidas") ?? "").trim() || null,
      bultos: bultos >= 1 ? bultos : null,
      editado: true,
    })
    .eq("tn_product_id", tnProductId)
    .eq("estado", "pendiente");
  if (error) volver({ error: error.message });
  volver({ saved: "Cambios guardados. La revisión de la web no los pisa." });
}

export async function recuperarAction(formData: FormData) {
  const { supabase } = await quien();
  const ids = formData.getAll("variante").map(String);
  const { error } = await supabase
    .from("web_pendientes")
    .update({ estado: "pendiente", resuelto_at: null, resuelto_por: null })
    .in("tn_variant_id", ids)
    .eq("estado", "descartado");
  if (error) volver({ error: error.message });
  revalidatePath("/admin", "layout");
  volver({ saved: "Vuelve a estar pendiente." });
}

// Corre la revisión de la web ahora (la misma que corre cada 3 horas).
export async function revisarWebAction() {
  const { supabase } = await quien();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) volver({ error: "Sesión vencida, volvé a entrar." });
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/lista-web`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) volver({ error: `No se pudo revisar la web: ${j.error ?? r.status}` });
  // si actualizó nombres/fotos/medidas de lo publicado, que la lista pública lo muestre ya
  invalidatePriceList();
  revalidatePath("/admin", "layout");
  const n = j.resumen?.pendientes_nuevos ?? 0;
  volver({ saved: n ? `Listo: ${n} color${n > 1 ? "es" : ""} nuevo${n > 1 ? "s" : ""} de la web.` : "Listo: no hay nada nuevo en la web." });
}
