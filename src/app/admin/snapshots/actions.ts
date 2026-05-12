"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/");
}

export async function createSnapshotAction(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const effective_date = String(formData.get("effective_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) {
    redirect(`/admin/snapshots?error=${encodeURIComponent("El nombre es obligatorio")}`);
  }

  // 1. Create the snapshot header
  const { data: snap, error: snapErr } = await supabase
    .from("price_snapshots")
    .insert({ name, effective_date, notes })
    .select("id")
    .single();

  if (snapErr || !snap) {
    redirect(`/admin/snapshots?error=${encodeURIComponent(snapErr?.message ?? "No se pudo crear")}`);
  }

  // 2. Snapshot every active product with its full denormalized context
  const { data: rows, error: fetchErr } = await supabase
    .from("products")
    .select(
      `
      id, name, sku, color_name, color_hex, color_hex_secondary,
      dimensions, packages, price, sort_order, active,
      product_groups!inner (
        id, name, sort_order, thumbnail_path,
        lines!inner (
          id, name, slug, number, eyebrow, description,
          highlight_letter, banner_style, sort_order, active
        )
      )
    `
    )
    .eq("active", true)
    .order("sort_order");

  if (fetchErr) {
    redirect(`/admin/snapshots?error=${encodeURIComponent(fetchErr.message)}`);
  }

  type Row = {
    id: string;
    name: string;
    sku: string;
    color_name: string;
    color_hex: string;
    color_hex_secondary: string | null;
    dimensions: string;
    packages: number;
    price: number;
    sort_order: number;
    product_groups: {
      id: string;
      name: string;
      sort_order: number;
      thumbnail_path: string | null;
      lines: {
        id: string;
        name: string;
        slug: string;
        number: number;
        eyebrow: string | null;
        description: string | null;
        highlight_letter: string | null;
        banner_style: "blue" | "cream";
        sort_order: number;
        active: boolean;
      };
    };
  };

  const items = (rows as unknown as Row[] ?? [])
    .filter((r) => r.product_groups.lines.active)
    .map((r) => ({
      snapshot_id: snap.id,
      product_id: r.id,
      product_name: r.name,
      sku: r.sku,
      color_name: r.color_name,
      color_hex: r.color_hex,
      color_hex_secondary: r.color_hex_secondary,
      dimensions: r.dimensions,
      packages: r.packages,
      price: r.price,
      sort_order: r.sort_order,
      product_group_id: r.product_groups.id,
      group_name: r.product_groups.name,
      group_sort_order: r.product_groups.sort_order,
      group_thumbnail_path: r.product_groups.thumbnail_path,
      line_id: r.product_groups.lines.id,
      line_name: r.product_groups.lines.name,
      line_slug: r.product_groups.lines.slug,
      line_number: r.product_groups.lines.number,
      line_eyebrow: r.product_groups.lines.eyebrow,
      line_description: r.product_groups.lines.description,
      line_highlight_letter: r.product_groups.lines.highlight_letter,
      line_banner_style: r.product_groups.lines.banner_style,
      line_sort_order: r.product_groups.lines.sort_order,
    }));

  if (items.length > 0) {
    const { error: insertErr } = await supabase.from("price_snapshot_items").insert(items);
    if (insertErr) {
      // Rollback header so we don't leave an empty snapshot
      await supabase.from("price_snapshots").delete().eq("id", snap.id);
      redirect(`/admin/snapshots?error=${encodeURIComponent(insertErr.message)}`);
    }
  }

  revalidatePath("/admin/snapshots");
  redirect(
    `/admin/snapshots?saved=${encodeURIComponent(`Versión "${name}" guardada con ${items.length} productos`)}`
  );
}

export async function renameSnapshotAction(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(`/admin/snapshots?error=${encodeURIComponent("Nombre vacío")}`);
  }
  await supabase.from("price_snapshots").update({ name }).eq("id", id);
  revalidatePath("/admin/snapshots");
  redirect(`/admin/snapshots?saved=${encodeURIComponent("Renombrado")}`);
}

export async function deleteSnapshotAction(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  await supabase.from("price_snapshots").delete().eq("id", id);
  revalidatePath("/admin/snapshots");
  redirect(`/admin/snapshots?saved=${encodeURIComponent("Versión eliminada")}`);
}
