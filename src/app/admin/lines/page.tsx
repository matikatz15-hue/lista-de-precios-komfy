import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createLineAction } from "./actions";
import type { Line } from "@/lib/types";

export default async function LinesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("lines").select("*").order("sort_order");
  const lines = (data ?? []) as Line[];

  return (
    <div>
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Líneas</h1>
          <p className="text-sm text-zinc-600 mt-1">Cada línea agrupa productos (MUK, BEL, AIRE...).</p>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-zinc-200 mb-6 overflow-hidden">
        {lines.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Todavía no hay líneas. Creá la primera abajo.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Orden</th>
                <th className="text-left px-4 py-3 font-semibold">N°</th>
                <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold">Slug</th>
                <th className="text-left px-4 py-3 font-semibold">Eyebrow</th>
                <th className="text-left px-4 py-3 font-semibold">Activa</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-500">{line.sort_order}</td>
                  <td className="px-4 py-3 font-mono">{line.number}</td>
                  <td className="px-4 py-3 font-semibold">{line.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{line.slug}</td>
                  <td className="px-4 py-3 text-zinc-600">{line.eyebrow ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        line.active ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {line.active ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/lines/${line.id}`}
                      className="text-[#0047BB] font-semibold hover:underline text-xs uppercase tracking-wider"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="font-semibold text-zinc-900 mb-4">Nueva línea</h2>
        <form action={createLineAction} className="grid grid-cols-2 gap-4">
          <Field label="Nombre (ej: MuK)" name="name" required />
          <Field label="Número" name="number" type="number" defaultValue="1" required />
          <Field label="Slug (ej: muk)" name="slug" placeholder="se genera del nombre" />
          <Field label="Orden" name="sort_order" type="number" defaultValue="0" />
          <Field
            label="Eyebrow (ej: Línea 01 · 6 colores)"
            name="eyebrow"
            className="col-span-2"
          />
          <Field
            label="Descripción"
            name="description"
            textarea
            className="col-span-2"
          />
          <Field
            label="Letra a destacar (ej: u en MuK)"
            name="highlight_letter"
            maxLength={1}
          />
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Estilo banner
            </label>
            <select
              name="banner_style"
              defaultValue="blue"
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
            >
              <option value="blue">Azul</option>
              <option value="cream">Crema</option>
            </select>
          </div>
          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
            >
              Crear línea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  className = "",
  textarea,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  textarea?: boolean;
  maxLength?: number;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
        />
      )}
    </div>
  );
}
