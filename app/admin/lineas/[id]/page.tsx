import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import LineForm from "@/components/admin/LineForm";
import Link from "next/link";

export default async function EditLineaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const line = await db.line.findUnique({ where: { id } });
  if (!line) notFound();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/admin/lineas" className="text-sm text-gray-400 hover:text-gray-600">← Líneas</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Editar línea: {line.name}</h1>
      </div>
      <LineForm initial={line} />
    </div>
  );
}
