"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CODIGO_MIN, hashCodigo, nuevoCodigo } from "@/lib/passkeys";

// Código para activar huella/cara en un dispositivo. Se muestra una sola vez: en la base queda el hash.
export async function generarCodigoAction(
  userId: string
): Promise<{ codigo: string; minutos: number } | { error: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Sesión vencida." };
  const { data: yo } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (yo?.role !== "admin") return { error: "Solo el admin genera códigos." };

  const admin = createAdminClient();
  const { data: destino } = await admin.from("profiles").select("id, active").eq("id", userId).single();
  if (!destino) return { error: "No existe ese usuario." };
  if (!destino.active) return { error: "El cliente está desactivado. Activalo primero." };

  const codigo = nuevoCodigo();
  const { error } = await admin.from("lp_codigos").upsert(
    {
      user_id: userId,
      hash: await hashCodigo(codigo),
      expira: new Date(Date.now() + CODIGO_MIN * 60000).toISOString(),
      intentos: 0,
      creado_por: data.user.email ?? "admin",
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) return { error: error.message };
  return { codigo, minutos: CODIGO_MIN };
}
