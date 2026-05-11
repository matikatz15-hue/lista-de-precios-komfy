"use client";

import { useEffect, useState } from "react";

interface Condition {
  id: string; code: string; label: string; detail: string; value: string; hot: boolean; order: number;
}

export default function CondicionesPage() {
  const [items, setItems] = useState<Condition[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/conditions").then(r => r.json()).then(setItems);
  }, []);

  function update(idx: number, field: keyof Condition, value: string | boolean | number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/conditions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Condiciones comerciales</h1>
          <p className="text-sm text-gray-500 mt-0.5">Estos datos se muestran en la página de condiciones del catálogo.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-[#0047BB] hover:bg-[#003A99] text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
          {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {items.map((item, idx) => (
          <div key={item.id} className="p-4 grid grid-cols-[40px_80px_1fr_1fr_100px_80px] gap-3 items-center">
            <span className="text-gray-400 text-sm font-mono">{idx + 1}</span>
            <input value={item.code} onChange={e => update(idx, "code", e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
            <input value={item.label} onChange={e => update(idx, "label", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
            <input value={item.detail} onChange={e => update(idx, "detail", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
            <input value={item.value} onChange={e => update(idx, "value", e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-[#0047BB]" />
            <label className="flex items-center gap-2 cursor-pointer justify-center">
              <input type="checkbox" checked={item.hot} onChange={e => update(idx, "hot", e.target.checked)} className="accent-[#FFA400] w-4 h-4" />
              <span className="text-xs font-semibold text-gray-500">Naranja</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
