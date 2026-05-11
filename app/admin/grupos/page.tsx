import { db } from "@/lib/db";
import Link from "next/link";

export default async function GruposPage() {
  const groups = await db.productGroup.findMany({
    orderBy: [{ line: { order: "asc" } }, { order: "asc" }],
    include: { line: true, _count: { select: { products: true } } },
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grupos de productos</h1>
        <Link href="/admin/grupos/nuevo" className="bg-[#0047BB] hover:bg-[#003A99] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
          + Nuevo grupo
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Línea</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Grupo</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Medidas</th>
              <th className="text-right px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">SKUs</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {groups.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <span className="inline-block bg-[#0047BB] text-white text-xs font-bold px-2 py-0.5 rounded">{g.line.name}</span>
                </td>
                <td className="px-6 py-3 font-semibold text-gray-900">{g.name}</td>
                <td className="px-6 py-3 text-gray-500 font-mono text-xs">{g.dimensions}</td>
                <td className="px-6 py-3 text-right font-semibold">{g._count.products}</td>
                <td className="px-6 py-3 text-right">
                  <Link href={`/admin/grupos/${g.id}`} className="text-[#0047BB] hover:underline font-semibold">Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {groups.length === 0 && (
          <div className="text-center py-12 text-gray-400">No hay grupos. <Link href="/admin/grupos/nuevo" className="text-[#0047BB]">Creá uno.</Link></div>
        )}
      </div>
    </div>
  );
}
