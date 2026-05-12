"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidatePriceList } from "@/lib/cache";

// Inline price update — used by the Excel-style cell.
// Returns the group id so the client can decide whether to prompt propagation.
export async function setProductPrice(
  productId: string,
  newPrice: number
): Promise<{ ok: boolean; groupId?: string; error?: string }> {
  if (!productId || !Number.isFinite(newPrice) || newPrice < 0) {
    return { ok: false, error: "Precio inválido" };
  }
  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from("products")
    .select("product_group_id")
    .eq("id", productId)
    .single();
  if (fetchErr || !existing) return { ok: false, error: "No se encontró el producto" };

  const { error } = await supabase
    .from("products")
    .update({ price: newPrice })
    .eq("id", productId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/groups/${existing.product_group_id}`);
  invalidatePriceList();
  return { ok: true, groupId: existing.product_group_id };
}

// Update one color's name/hex/hex2 across every product that uses it.
// Identified by the exact tuple (color_name, color_hex, color_hex_secondary).
export async function updatePaletteColor(args: {
  oldName: string;
  oldHex: string;
  oldHex2: string | null;
  newName: string;
  newHex: string;
  newHex2: string | null;
}): Promise<{ ok: boolean; updated?: number; error?: string }> {
  const { oldName, oldHex, oldHex2, newName, newHex, newHex2 } = args;
  if (!newName.trim() || !/^#[0-9a-fA-F]{3,8}$/.test(newHex)) {
    return { ok: false, error: "Datos inválidos" };
  }
  const supabase = await createClient();

  // Find affected rows first so we can report a count and revalidate by group
  let query = supabase
    .from("products")
    .select("id, product_group_id")
    .eq("color_name", oldName)
    .eq("color_hex", oldHex);
  if (oldHex2) query = query.eq("color_hex_secondary", oldHex2);
  else query = query.is("color_hex_secondary", null);

  const { data: affected, error: findErr } = await query;
  if (findErr) return { ok: false, error: findErr.message };
  if (!affected || affected.length === 0) {
    return { ok: false, error: "No se encontraron productos con ese color" };
  }

  let updateQ = supabase
    .from("products")
    .update({
      color_name: newName.trim(),
      color_hex: newHex,
      color_hex_secondary: newHex2 && newHex2.trim() ? newHex2.trim() : null,
    })
    .eq("color_name", oldName)
    .eq("color_hex", oldHex);
  if (oldHex2) updateQ = updateQ.eq("color_hex_secondary", oldHex2);
  else updateQ = updateQ.is("color_hex_secondary", null);

  const { error: updateErr } = await updateQ;
  if (updateErr) return { ok: false, error: updateErr.message };

  // Revalidate every affected group
  const groupIds = new Set(affected.map((r) => r.product_group_id));
  for (const gid of groupIds) revalidatePath(`/admin/groups/${gid}`);
  revalidatePath("/admin/precios");
  invalidatePriceList();
  return { ok: true, updated: affected.length };
}

// Apply the same price to every product of a group.
export async function applyPriceToGroup(
  groupId: string,
  newPrice: number
): Promise<{ ok: boolean; updated?: number; error?: string }> {
  if (!groupId || !Number.isFinite(newPrice) || newPrice < 0) {
    return { ok: false, error: "Datos inválidos" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ price: newPrice })
    .eq("product_group_id", groupId)
    .select("id");
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/groups/${groupId}`);
  invalidatePriceList();
  return { ok: true, updated: data?.length ?? 0 };
}

export async function createProductAction(formData: FormData) {
  const supabase = await createClient();
  const product_group_id = String(formData.get("product_group_id"));
  const name = String(formData.get("name") ?? "").trim();

  await supabase.from("products").insert({
    product_group_id,
    name,
    sku: String(formData.get("sku") ?? "").trim(),
    color_name: String(formData.get("color_name") ?? "").trim(),
    color_hex: String(formData.get("color_hex") ?? "#999999").trim(),
    color_hex_secondary: String(formData.get("color_hex_secondary") ?? "").trim() || null,
    dimensions: String(formData.get("dimensions") ?? "").trim(),
    packages: Number(formData.get("packages") ?? 1),
    price: Number(formData.get("price") ?? 0),
    sort_order: Number(formData.get("sort_order") ?? 0),
    active: true,
  });

  revalidatePath(`/admin/groups/${product_group_id}`);
  invalidatePriceList();
  redirect(`/admin/groups/${product_group_id}?saved=${encodeURIComponent("Variante agregada")}`);
}

export async function updateProductAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { data: existing } = await supabase
    .from("products")
    .select("product_group_id")
    .eq("id", id)
    .single();

  await supabase
    .from("products")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      sku: String(formData.get("sku") ?? "").trim(),
      color_name: String(formData.get("color_name") ?? "").trim(),
      color_hex: String(formData.get("color_hex") ?? "#999999").trim(),
      color_hex_secondary: String(formData.get("color_hex_secondary") ?? "").trim() || null,
      dimensions: String(formData.get("dimensions") ?? "").trim(),
      packages: Number(formData.get("packages") ?? 1),
      price: Number(formData.get("price") ?? 0),
      sort_order: Number(formData.get("sort_order") ?? 0),
      active: formData.get("active") === "on",
    })
    .eq("id", id);

  if (existing?.product_group_id) revalidatePath(`/admin/groups/${existing.product_group_id}`);
  invalidatePriceList();
  if (existing?.product_group_id) {
    redirect(`/admin/groups/${existing.product_group_id}?saved=${encodeURIComponent("Cambios guardados")}`);
  }
}

export async function deleteProductAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { data: existing } = await supabase
    .from("products")
    .select("product_group_id")
    .eq("id", id)
    .single();

  await supabase.from("products").delete().eq("id", id);

  if (existing?.product_group_id) {
    revalidatePath(`/admin/groups/${existing.product_group_id}`);
    invalidatePriceList();
    redirect(`/admin/groups/${existing.product_group_id}`);
  }
}
