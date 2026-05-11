import LineForm from "@/components/admin/LineForm";
import Link from "next/link";

export default function NuevaLineaPage() {
  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/admin/lineas" className="text-sm text-gray-400 hover:text-gray-600">← Líneas</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Nueva línea</h1>
      </div>
      <LineForm />
    </div>
  );
}
