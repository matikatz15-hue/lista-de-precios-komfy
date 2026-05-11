"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Line { id: string; name: string }
interface GroupData { id?: string; lineId?: string; name?: string; dimensions?: string; order?: number }

export default function GroupForm({ initial, lines }: { initial?: GroupData; lines: Line[] }) {
  const isEdit = !!initial?.id;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      lineId: fd.get("lineId"),
      name: fd.get("name"),
      dimensions: fd.get("dimensions"),
      order: Number(fd.get("order")),
    };
    const url = isEdit ? `/api/groups/${initial.id}` : "/api/groups";
    const method = isEdit ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.push("/admin/grupos");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar grupo "${initial?.name}"? Se eliminarán todos sus productos.`)) return;
    setDeleting(true);
    await fetch(`/api/groups/${initial!.id}`, { method: "DELETE" });
    router.push("/admin/grupos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Línea *</label>
        <select name="lineId" required defaultValue={initial?.lineId ?? ""}
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB] bg-white">
          <option value="" disabled>Seleccioná una línea</option>
          {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del grupo *</label>
        <input name="name" required defaultValue={initial?.name} placeholder="Rack TV / Recibidor"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Medidas del grupo *</label>
        <input name="dimensions" required defaultValue={initial?.dimensions} placeholder="38 × 143,7 × 95,6 cm"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
        <p className="text-xs text-gray-400 mt-1">Medidas generales o texto descriptivo para el encabezado de la tabla.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Orden</label>
        <input name="order" type="number" min="0" defaultValue={initial?.order ?? 0}
          className="w-32 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="bg-[#0047BB] hover:bg-[#003A99] text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear grupo"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-4 py-2.5">
          Cancelar
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="ml-auto text-sm font-semibold text-red-500 hover:text-red-700 disabled:opacity-60">
            {deleting ? "Eliminando..." : "Eliminar grupo"}
          </button>
        )}
      </div>
    </form>
  );
}
