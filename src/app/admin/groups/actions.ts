"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidatePriceList } from "@/lib/cache";

async function uploadThumbnail(file: File, groupId: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `groups/${groupId}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage.from("products").upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: true,
  });
  if (error) {
    console.error("upload error", error);
    return null;
  }
  return path;
}

async function deleteThumbnail(path: string | null) {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from("products").remove([path]);
}

export async function createGroupAction(formData: FormData) {
  const supabase = await createClient();
  const line_id = String(formData.get("line_id"));
  const name = String(formData.get("name") ?? "").trim();
  const base_dimensions = String(formData.get("base_dimensions") ?? "").trim() || null;
  const meta_label = String(formData.get("meta_label") ?? "").trim() || null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  const { data, error } = await supabase
    .from("product_groups")
    .insert({ line_id, name, base_dimensions, meta_label, sort_order })
    .select("id")
    .single();

  if (error || !data) return;

  const file = formData.get("thumbnail") as File | null;
  if (file && file.size > 0) {
    const path = await uploadThumbnail(file, data.id);
    if (path) {
      await supabase.from("product_groups").update({ thumbnail_path: path }).eq("id", data.id);
    }
  }

  revalidatePath(`/admin/lines/${line_id}`);
  invalidatePriceList();
  redirect(`/admin/lines/${line_id}?saved=${encodeURIComponent("Grupo creado")}`);
}

export async function updateGroupAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const base_dimensions = String(formData.get("base_dimensions") ?? "").trim() || null;
  const meta_label = String(formData.get("meta_label") ?? "").trim() || null;
  const sort_order = Number(formData.get("sort_order") ?? 0);

  await supabase
    .from("product_groups")
    .update({ name, base_dimensions, meta_label, sort_order })
    .eq("id", id);

  const file = formData.get("thumbnail") as File | null;
  if (file && file.size > 0) {
    const { data: existing } = await supabase
      .from("product_groups")
      .select("thumbnail_path, line_id")
      .eq("id", id)
      .single();

    if (existing?.thumbnail_path) await deleteThumbnail(existing.thumbnail_path);
    const newPath = await uploadThumbnail(file, id);
    if (newPath) {
      await supabase.from("product_groups").update({ thumbnail_path: newPath }).eq("id", id);
    }
    if (existing?.line_id) revalidatePath(`/admin/lines/${existing.line_id}`);
  }

  revalidatePath(`/admin/groups/${id}`);
  invalidatePriceList();
  redirect(`/admin/groups/${id}?saved=${encodeURIComponent("Cambios guardados")}`);
}

export async function deleteGroupAction(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  const { data } = await supabase
    .from("product_groups")
    .select("thumbnail_path, line_id")
    .eq("id", id)
    .single();

  if (data?.thumbnail_path) await deleteThumbnail(data.thumbnail_path);
  await supabase.from("product_groups").delete().eq("id", id);

  invalidatePriceList();
  if (data?.line_id) {
    revalidatePath(`/admin/lines/${data.line_id}`);
    redirect(`/admin/lines/${data.line_id}`);
  } else {
    redirect("/admin/lines");
  }
}
