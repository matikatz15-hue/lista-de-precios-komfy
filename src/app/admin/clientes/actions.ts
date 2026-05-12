"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidatePriceList } from "@/lib/cache";

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

export async function createClientAction(formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim();

  if (!email || !password) {
    redirect("/admin/clientes/new?error=email%20y%20password%20son%20obligatorios");
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (error || !created.user) {
    redirect(`/admin/clientes/new?error=${encodeURIComponent(error?.message ?? "no se pudo crear")}`);
  }

  // The handle_new_user trigger may have created a profile; ensure it has the right fields.
  await admin.from("profiles").upsert(
    {
      id: created.user.id,
      email,
      full_name,
      role: "client",
      active: true,
    },
    { onConflict: "id" }
  );

  revalidatePath("/admin/clientes");
  redirect(`/admin/clientes/${created.user.id}`);
}

export async function updateClientAction(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim(),
      active: formData.get("active") === "on",
    })
    .eq("id", id);

  revalidatePath(`/admin/clientes/${id}`);
  revalidatePath("/admin/clientes");
  redirect(`/admin/clientes/${id}?msg=${encodeURIComponent("Datos guardados")}`);
}

export async function resetPasswordAction(formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const newPassword = String(formData.get("new_password") ?? "");
  if (!newPassword || newPassword.length < 6) {
    redirect(`/admin/clientes/${id}?error=password%20muy%20corta`);
  }
  await admin.auth.admin.updateUserById(id, { password: newPassword });
  redirect(`/admin/clientes/${id}?msg=password%20actualizada`);
}

export async function deleteClientAction(formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  await admin.auth.admin.deleteUser(id);
  revalidatePath("/admin/clientes");
  invalidatePriceList();
  redirect("/admin/clientes");
}

export async function upsertGeneralDiscountAction(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const client_id = String(formData.get("client_id"));
  const raw = String(formData.get("percent") ?? "").trim();

  // Replace existing general discount (delete + insert pattern works with partial unique indexes)
  await supabase
    .from("discounts")
    .delete()
    .eq("client_id", client_id)
    .eq("type", "general");

  if (raw) {
    const percent = Number(raw);
    await supabase.from("discounts").insert({
      client_id,
      type: "general",
      percent,
      line_id: null,
      product_id: null,
    });
  }

  revalidatePath(`/admin/clientes/${client_id}`);
  invalidatePriceList();
  redirect(`/admin/clientes/${client_id}?msg=${encodeURIComponent("Descuento guardado")}`);
}

export async function upsertLineDiscountAction(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const client_id = String(formData.get("client_id"));
  const line_id = String(formData.get("line_id"));
  const raw = String(formData.get("percent") ?? "").trim();

  // Delete existing for this client+line
  await supabase
    .from("discounts")
    .delete()
    .eq("client_id", client_id)
    .eq("type", "line")
    .eq("line_id", line_id);

  if (raw) {
    const percent = Number(raw);
    await supabase.from("discounts").insert({
      client_id,
      type: "line",
      line_id,
      product_id: null,
      percent,
    });
  }

  revalidatePath(`/admin/clientes/${client_id}`);
  invalidatePriceList();
  redirect(`/admin/clientes/${client_id}?msg=${encodeURIComponent("Descuento guardado")}`);
}

export async function addProductDiscountAction(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const client_id = String(formData.get("client_id"));
  const product_id = String(formData.get("product_id"));
  const percent = Number(formData.get("percent") ?? 0);

  await supabase
    .from("discounts")
    .delete()
    .eq("client_id", client_id)
    .eq("type", "product")
    .eq("product_id", product_id);

  await supabase.from("discounts").insert({
    client_id,
    type: "product",
    product_id,
    line_id: null,
    percent,
  });

  revalidatePath(`/admin/clientes/${client_id}`);
  invalidatePriceList();
  redirect(`/admin/clientes/${client_id}?msg=${encodeURIComponent("Descuento guardado")}`);
}

export async function deleteDiscountAction(formData: FormData) {
  await assertAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const client_id = String(formData.get("client_id"));
  await supabase.from("discounts").delete().eq("id", id);
  revalidatePath(`/admin/clientes/${client_id}`);
  invalidatePriceList();
  redirect(`/admin/clientes/${client_id}?msg=${encodeURIComponent("Descuento guardado")}`);
}
