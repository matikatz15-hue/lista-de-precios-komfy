import { db } from "@/lib/db";
import GroupForm from "@/components/admin/GroupForm";
import Link from "next/link";

export default async function NuevoGrupoPage() {
  const lines = await db.line.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } });

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/admin/grupos" className="text-sm text-gray-400 hover:text-gray-600">← Grupos</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Nuevo grupo</h1>
      </div>
      <GroupForm lines={lines} />
    </div>
  );
}
