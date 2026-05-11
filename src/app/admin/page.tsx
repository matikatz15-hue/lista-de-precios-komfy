import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [linesRes, groupsRes, productsRes] = await Promise.all([
    supabase.from("lines").select("id", { count: "exact", head: true }),
    supabase.from("product_groups").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Dashboard</h1>
      <p className="text-sm text-zinc-600 mb-8">Gestioná líneas, productos y configuración de la lista de precios.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="Líneas" value={linesRes.count ?? 0} href="/admin/lines" />
        <StatCard label="Grupos de productos" value={groupsRes.count ?? 0} />
        <StatCard label="Productos / SKUs" value={productsRes.count ?? 0} />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/lines"
            className="px-4 py-2 bg-[#0047BB] text-white text-sm font-semibold rounded-md hover:bg-[#003691]"
          >
            Administrar líneas
          </Link>
          <Link
            href="/admin/settings"
            className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 text-sm font-semibold rounded-md hover:bg-zinc-50"
          >
            Editar settings
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <>
      <div className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-2">{label}</div>
      <div className="text-4xl font-bold text-[#0047BB]">{value}</div>
    </>
  );
  const className = "bg-white rounded-xl border border-zinc-200 p-5 block hover:border-zinc-300 transition-colors";
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
