"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface LineData {
  id?: string;
  name?: string;
  eyebrow?: string;
  description?: string;
  order?: number;
}

export default function LineForm({ initial }: { initial?: LineData }) {
  const isEdit = !!initial?.id;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      eyebrow: fd.get("eyebrow"),
      description: fd.get("description"),
      order: Number(fd.get("order")),
    };
    const url = isEdit ? `/api/lines/${initial.id}` : "/api/lines";
    const method = isEdit ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.push("/admin/lineas");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar línea "${initial?.name}"? Se eliminarán todos sus grupos y productos.`)) return;
    setDeleting(true);
    await fetch(`/api/lines/${initial!.id}`, { method: "DELETE" });
    router.push("/admin/lineas");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la línea *</label>
        <input name="name" required defaultValue={initial?.name} placeholder="MUK"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Eyebrow / tag *</label>
        <input name="eyebrow" required defaultValue={initial?.eyebrow} placeholder="Línea 01 · 6 colores"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
        <p className="text-xs text-gray-400 mt-1">Texto pequeño que aparece arriba del nombre en el banner.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción del banner *</label>
        <textarea name="description" required defaultValue={initial?.description} rows={3}
          placeholder="Microtexturados y gris topo. Racks, estanterías..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB] resize-none" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Orden</label>
        <input name="order" type="number" min="0" defaultValue={initial?.order ?? 0}
          className="w-32 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
        <p className="text-xs text-gray-400 mt-1">0 = primera línea en el catálogo.</p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="bg-[#0047BB] hover:bg-[#003A99] text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear línea"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-4 py-2.5">
          Cancelar
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="ml-auto text-sm font-semibold text-red-500 hover:text-red-700 disabled:opacity-60">
            {deleting ? "Eliminando..." : "Eliminar línea"}
          </button>
        )}
      </div>
    </form>
  );
}
