"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidatePriceList } from "@/lib/cache";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createLineAction(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const number = Number(formData.get("number") ?? 1);
  const slug = String(formData.get("slug") ?? "").trim() || slugify(name);
  const eyebrow = String(formData.get("eyebrow") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const highlight_letter = String(formData.get("highlight_letter") ?? "").trim() || null;
  const banner_style = String(formData.get("banner_style") ?? "blue");
  const sort_order = Number(formData.get("sort_order") ?? 0);

  await supabase.from("lines").insert({
    slug,
    name,
    number,
    eyebrow,
    description,
    highlight_letter,
    banner_style,
    sort_order,
    active: true,
  });

  revalidatePath("/admin/lines");
  invalidatePriceList();
  redirect(`/admin/lines?saved=${encodeURIComponent("Línea creada")}`);
}

export async function updateLineAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase
    .from("lines")
    .update({
      slug: String(formData.get("slug") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      number: Number(formData.get("number") ?? 1),
      eyebrow: String(formData.get("eyebrow") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      highlight_letter: String(formData.get("highlight_letter") ?? "").trim() || null,
      banner_style: String(formData.get("banner_style") ?? "blue"),
      sort_order: Number(formData.get("sort_order") ?? 0),
      active: formData.get("active") === "on",
    })
    .eq("id", id);

  revalidatePath("/admin/lines");
  revalidatePath(`/admin/lines/${id}`);
  invalidatePriceList();
  redirect(`/admin/lines/${id}?saved=${encodeURIComponent("Cambios guardados")}`);
}

export async function deleteLineAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("lines").delete().eq("id", id);
  revalidatePath("/admin/lines");
  invalidatePriceList();
  redirect(`/admin/lines?saved=${encodeURIComponent("Línea eliminada")}`);
}
