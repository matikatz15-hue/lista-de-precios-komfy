"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Group { id: string; name: string; line: { name: string } }
interface ProductData {
  id?: string; groupId?: string; name?: string; sku?: string;
  color?: string; colorHex?: string; colorHex2?: string | null;
  dimensions?: string; bulkQty?: number; price?: number;
  imageUrl?: string | null; order?: number;
}

export default function ProductForm({ initial, groups }: { initial?: ProductData; groups: Group[] }) {
  const isEdit = !!initial?.id;
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [colorHex, setColorHex] = useState(initial?.colorHex || "#1C1C1C");
  const [colorHex2, setColorHex2] = useState(initial?.colorHex2 || "");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setImageUrl(data.url || "");
    setUploading(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      groupId: fd.get("groupId"),
      name: fd.get("name"),
      sku: fd.get("sku"),
      color: fd.get("color"),
      colorHex,
      colorHex2: colorHex2 || null,
      dimensions: fd.get("dimensions"),
      bulkQty: Number(fd.get("bulkQty")),
      price: Number(fd.get("price")),
      imageUrl: imageUrl || null,
      order: Number(fd.get("order")),
    };
    const url = isEdit ? `/api/products/${initial.id}` : "/api/products";
    const method = isEdit ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.push("/admin/productos");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar producto "${initial?.name} · ${initial?.color}"?`)) return;
    setDeleting(true);
    await fetch(`/api/products/${initial!.id}`, { method: "DELETE" });
    router.push("/admin/productos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Grupo *</label>
          <select name="groupId" required defaultValue={initial?.groupId ?? ""}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB] bg-white">
            <option value="" disabled>Seleccioná un grupo</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.line.name} › {g.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del producto *</label>
          <input name="name" required defaultValue={initial?.name} placeholder="Rack TV / Recibidor"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">SKU / Código *</label>
          <input name="sku" required defaultValue={initial?.sku} placeholder="002-R15-NST"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color (nombre) *</label>
          <input name="color" required defaultValue={initial?.color} placeholder="Negro microtexturado"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Medidas *</label>
          <input name="dimensions" required defaultValue={initial?.dimensions} placeholder="38 × 143,7 × 95,6 cm"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color primario (swatch) *</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
              className="h-10 w-14 rounded border border-gray-200 cursor-pointer p-0.5" />
            <input type="text" value={colorHex} onChange={e => setColorHex(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color secundario (swatch dividido)</label>
          <div className="flex gap-2 items-center">
            <input type="color" value={colorHex2 || "#FFFFFF"} onChange={e => setColorHex2(e.target.value)}
              className="h-10 w-14 rounded border border-gray-200 cursor-pointer p-0.5" />
            <input type="text" value={colorHex2} onChange={e => setColorHex2(e.target.value)}
              placeholder="Dejar vacío si es un solo color"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Para combinaciones tipo Negro Mate + Roble.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio (sin IVA) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#FFA400] font-bold text-sm">$</span>
            <input name="price" type="number" step="0.01" min="0" required defaultValue={initial?.price}
              className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bultos *</label>
          <input name="bulkQty" type="number" min="1" required defaultValue={initial?.bulkQty ?? 1}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Orden</label>
          <input name="order" type="number" min="0" defaultValue={initial?.order ?? 0}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Foto del producto</label>
        <div className="flex gap-4 items-start">
          {imageUrl && (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
              <Image src={imageUrl} alt="producto" fill className="object-cover" />
            </div>
          )}
          <div className="flex-1">
            <input type="file" accept="image/*" ref={fileRef} onChange={handleUpload} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm font-semibold text-gray-500 hover:border-[#0047BB] hover:text-[#0047BB] transition-colors disabled:opacity-60">
              {uploading ? "Subiendo..." : "Subir foto"}
            </button>
            {imageUrl && (
              <button type="button" onClick={() => setImageUrl("")}
                className="ml-3 text-sm text-red-400 hover:text-red-600">
                Quitar foto
              </button>
            )}
            <p className="text-xs text-gray-400 mt-1.5">JPG, PNG o WebP. Máx. 5 MB.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving || uploading}
          className="bg-[#0047BB] hover:bg-[#003A99] text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-4 py-2.5">
          Cancelar
        </button>
        {isEdit && (
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="ml-auto text-sm font-semibold text-red-500 hover:text-red-700 disabled:opacity-60">
            {deleting ? "Eliminando..." : "Eliminar producto"}
          </button>
        )}
      </div>
    </form>
  );
}
