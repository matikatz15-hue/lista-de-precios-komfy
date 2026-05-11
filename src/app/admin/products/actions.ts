"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createProductAction(formData: FormData) {
  const supabase = await createClient();
  const product_group_id = String(formData.get("product_group_id"));

  await supabase.from("products").insert({
    product_group_id,
    name: String(formData.get("name") ?? "").trim(),
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
  revalidatePath("/");
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
  revalidatePath("/");
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
    revalidatePath("/");
    redirect(`/admin/groups/${existing.product_group_id}`);
  }
}
