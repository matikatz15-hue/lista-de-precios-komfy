import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CodigoActivacion } from "@/components/CodigoActivacion";
import type { Profile, Discount } from "@/lib/types";

export default async function ClientesPage() {
  const supabase = await createClient();

  const [profilesRes, discountsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("created_at", { ascending: false }),
    supabase.from("discounts").select("client_id"),
  ]);

  const profiles = (profilesRes.data ?? []) as Profile[];
  const { data: yo } = await supabase.auth.getUser();
  const { data: misLlaves } = yo.user
    ? await createAdminClient().from("lp_passkeys").select("id, dispositivo").eq("user_id", yo.user.id)
    : { data: [] };
  const discountCounts = new Map<string, number>();
  for (const d of (discountsRes.data ?? []) as Pick<Discount, "client_id">[]) {
    discountCounts.set(d.client_id, (discountCounts.get(d.client_id) ?? 0) + 1);
  }

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Clientes</h1>
          <p className="text-sm text-zinc-600 mt-1">
            Cada cliente entra a /login con su contraseña o con su huella/cara (con el código que le generás en su ficha).
          </p>
        </div>
        <Link
          href="/admin/clientes/new"
          className="px-4 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
        >
          + Nuevo cliente
        </Link>
      </header>

      {yo.user && (
        <section className="bg-white rounded-xl border border-zinc-200 p-5 mb-6">
          <h2 className="font-semibold">Tu huella o cara (admin)</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {misLlaves?.length
              ? `Activada en: ${misLlaves.map((l) => l.dispositivo ?? "Dispositivo").join(", ")}.`
              : "Todavía no la activaste en ningún dispositivo."}{" "}
            Generá un código y usalo en el login de tu celu o compu.
          </p>
          <CodigoActivacion userId={yo.user.id} email={yo.user.email ?? ""} />
        </section>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {profiles.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Todavía no hay clientes. Creá el primero con &quot;+ Nuevo cliente&quot;.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold">Estado</th>
                <th className="text-left px-4 py-3 font-semibold">Descuentos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.email}</td>
                  <td className="px-4 py-3 font-semibold">{p.full_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{discountCounts.get(p.id) ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/clientes/${p.id}`}
                      className="text-[#0047BB] font-semibold hover:underline text-xs uppercase tracking-wider"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
