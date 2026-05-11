import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import GroupForm from "@/components/admin/GroupForm";
import Link from "next/link";

export default async function EditGrupoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [group, lines] = await Promise.all([
    db.productGroup.findUnique({ where: { id } }),
    db.line.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!group) notFound();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/admin/grupos" className="text-sm text-gray-400 hover:text-gray-600">← Grupos</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Editar grupo: {group.name}</h1>
      </div>
      <GroupForm initial={group} lines={lines} />
    </div>
  );
}
