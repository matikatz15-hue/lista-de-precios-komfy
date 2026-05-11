"use client";

import { useEffect, useState, FormEvent } from "react";

const FIELDS = [
  { key: "periodo",   label: "Período",         placeholder: "Marzo 2026" },
  { key: "vigencia",  label: "Vigencia",         placeholder: "11 · 03 · 26" },
  { key: "version",   label: "Versión",           placeholder: "v3.1" },
  { key: "contacto",  label: "Email de contacto", placeholder: "hola@komfy.com.ar" },
  { key: "telefono",  label: "Teléfono",          placeholder: "+54 9 341 331-8965" },
  { key: "web",       label: "Sitio web",         placeholder: "komfy.com.ar" },
  { key: "intro-p1",  label: "Intro párrafo 1",   placeholder: "¡Hola! Esta lista...", multiline: true },
  { key: "intro-p2",  label: "Intro párrafo 2",   placeholder: "En Komfy...", multiline: true },
];

export default function AjustesPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(setValues);
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes del catálogo</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vigencia, contacto, textos del catálogo.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
            {f.multiline ? (
              <textarea
                value={values[f.key] || ""}
                onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB] resize-none"
              />
            ) : (
              <input
                value={values[f.key] || ""}
                onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0047BB]"
              />
            )}
          </div>
        ))}

        <button type="submit" disabled={saving}
          className="w-full bg-[#0047BB] hover:bg-[#003A99] text-white font-bold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
          {saved ? "✓ Guardado" : saving ? "Guardando..." : "Guardar ajustes"}
        </button>
      </form>
    </div>
  );
}
