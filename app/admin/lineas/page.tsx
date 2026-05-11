import { db } from "@/lib/db";
import Link from "next/link";

export default async function LineasPage() {
  const lines = await db.line.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { groups: true } } },
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Líneas</h1>
        <Link href="/admin/lineas/nueva" className="bg-[#0047BB] hover:bg-[#003A99] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
          + Nueva línea
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Orden</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Eyebrow</th>
              <th className="text-right px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Grupos</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-400 font-mono">{l.order}</td>
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
        {lines.length === 0 && (
          <div className="text-center py-12 text-gray-400">No hay líneas. <Link href="/admin/lineas/nueva" className="text-[#0047BB]">Creá una.</Link></div>
        )}
      </div>
    </div>
  );
}
