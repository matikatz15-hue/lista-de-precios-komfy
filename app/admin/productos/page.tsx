import { db } from "@/lib/db";
import Link from "next/link";

export default async function ProductosPage() {
  const products = await db.product.findMany({
    orderBy: [{ group: { line: { order: "asc" } } }, { group: { order: "asc" } }, { order: "asc" }],
    include: { group: { include: { line: true } } },
  });

  function fmt(n: number) {
    return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos / SKUs</h1>
        <Link href="/admin/productos/nuevo" className="bg-[#0047BB] hover:bg-[#003A99] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
          + Nuevo producto
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Línea / Grupo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Color</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Precio</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <span className="inline-block bg-[#0047BB] text-white text-xs font-bold px-1.5 py-0.5 rounded mr-1">{p.group.line.name}</span>
                  <span className="text-gray-500 text-xs">{p.group.name}</span>
                </td>
                <td className="px-4 py-2.5 font-semibold text-gray-900">{p.name}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-[#0047BB]">{p.sku}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span style={{
                      width: 12, height: 12, borderRadius: 99, display: "inline-block", flexShrink: 0,
                      background: p.colorHex2
                        ? `linear-gradient(135deg, ${p.colorHex} 50%, ${p.colorHex2} 50%)`
                        : p.colorHex,
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)",
                    }} />
                    <span className="text-gray-600 text-xs truncate max-w-[140px]">{p.color}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right font-bold">
                  <span className="text-[#FFA400] mr-0.5">$</span>{fmt(p.price)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/productos/${p.id}`} className="text-[#0047BB] hover:underline font-semibold">Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-400">No hay productos. <Link href="/admin/productos/nuevo" className="text-[#0047BB]">Creá uno.</Link></div>
        )}
      </div>
    </div>
  );
}
