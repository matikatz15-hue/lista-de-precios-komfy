import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";

export default async function EditProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, groups] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.productGroup.findMany({
      orderBy: [{ line: { order: "asc" } }, { order: "asc" }],
      include: { line: { select: { name: true } } },
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/productos" className="text-sm text-gray-400 hover:text-gray-600">← Productos</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Editar: {product.name} · {product.color}</h1>
      </div>
      <ProductForm initial={product} groups={groups} />
    </div>
  );
}
