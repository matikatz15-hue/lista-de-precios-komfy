import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";

export default async function NuevoProductoPage() {
  const groups = await db.productGroup.findMany({
    orderBy: [{ line: { order: "asc" } }, { order: "asc" }],
    include: { line: { select: { name: true } } },
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/productos" className="text-sm text-gray-400 hover:text-gray-600">← Productos</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Nuevo producto</h1>
      </div>
      <ProductForm groups={groups} />
    </div>
  );
}
