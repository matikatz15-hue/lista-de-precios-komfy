import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
  const [lineCount, groupCount, productCount] = await Promise.all([
    db.line.count(),
    db.productGroup.count(),
    db.product.count(),
  ]);

  const lines = await db.line.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { groups: true } } },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">Bienvenido al panel de administración de Komfy.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Líneas", value: lineCount, href: "/admin/lineas", color: "bg-[#0047BB]" },
          { label: "Grupos", value: groupCount, href: "/admin/grupos", color: "bg-[#003A99]" },
          { label: "Productos / SKUs", value: productCount, href: "/admin/productos", color: "bg-[#FFA400]" },
        ].map((s) => (
          <Link key={s.href} href={s.href} className="group block rounded-xl p-5 text-white no-underline" style={{ background: s.color }}>
            <div className="font-black text-4xl mb-1">{s.value}</div>
            <div className="text-sm font-semibold opacity-80">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Líneas activas</h2>
          <Link href="/admin/lineas/nueva" className="text-sm font-semibold text-[#0047BB] hover:underline">+ Nueva línea</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Línea</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Eyebrow</th>
              <th className="text-right px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Grupos</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-bold text-gray-900">{l.name}</td>
                <td className="px-6 py-3 text-gray-500">{l.eyebrow}</td>
                <td className="px-6 py-3 text-right font-semibold">{l._count.groups}</td>
                <td className="px-6 py-3 text-right">
                  <Link href={`/admin/lineas/${l.id}`} className="text-[#0047BB] hover:underline font-semibold">Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
