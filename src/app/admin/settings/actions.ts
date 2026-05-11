"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Condition } from "@/lib/types";

export async function updateSettingsAction(formData: FormData) {
  const supabase = await createClient();

  let conditions: Condition[] = [];
  const raw = String(formData.get("conditions") ?? "[]");
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) conditions = parsed as Condition[];
  } catch {
    // ignore invalid JSON, keep empty
  }

  const effective_date_raw = String(formData.get("effective_date") ?? "").trim();

  await supabase
    .from("settings")
    .update({
      period_label: String(formData.get("period_label") ?? "").trim() || null,
      effective_date: effective_date_raw || null,
      contact_email: String(formData.get("contact_email") ?? "").trim() || null,
      contact_phone: String(formData.get("contact_phone") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      website_url: String(formData.get("website_url") ?? "").trim() || null,
      cover_subtitle: String(formData.get("cover_subtitle") ?? "").trim() || null,
      intro_title: String(formData.get("intro_title") ?? "").trim() || null,
      intro_body: String(formData.get("intro_body") ?? "").trim() || null,
      stat_lines: Number(formData.get("stat_lines") ?? 0) || null,
      stat_skus: Number(formData.get("stat_skus") ?? 0) || null,
      stat_finishes: Number(formData.get("stat_finishes") ?? 0) || null,
      conditions,
    })
    .eq("id", 1);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
