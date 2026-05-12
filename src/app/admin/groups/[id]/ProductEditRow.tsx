"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { updateProductAction, deleteProductAction } from "../../products/actions";
import type { Product } from "@/lib/types";

export function ProductEditRow({ product: p }: { product: Product }) {
  const [editing, setEditing] = useState(false);

  const swatchStyle: React.CSSProperties = p.color_hex_secondary
    ? { background: `linear-gradient(135deg, ${p.color_hex} 50%, ${p.color_hex_secondary} 50%)` }
    : { background: p.color_hex };

  return (
    <tr className="border-t border-zinc-100">
      <td className="px-3 py-3">{p.name}</td>
      <td className="px-3 py-3 font-mono text-xs text-[#0047BB]">{p.sku}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full border border-black/20"
            style={swatchStyle}
            aria-hidden
          />
          <span className="text-xs">{p.color_name}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-zinc-600">{p.dimensions}</td>
      <td className="px-3 py-3 text-right">{p.packages}</td>
      <td className="px-3 py-3 text-right font-mono font-semibold">
        ${Number(p.price).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-3 py-3 text-right relative">
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="text-[#0047BB] font-semibold hover:underline text-xs uppercase tracking-wider"
        >
          {editing ? "Cerrar" : "Editar"}
        </button>

        {editing && (
          <>
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setEditing(false)}
              aria-hidden
            />
            <div className="absolute right-0 top-full mt-2 bg-white shadow-xl rounded-lg border border-zinc-200 p-5 w-[420px] z-20 text-left">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100">
                <div className="font-semibold text-sm">Editar variante</div>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  aria-label="Cerrar"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <form action={updateProductAction} className="grid grid-cols-2 gap-3">
                <input type="hidden" name="id" value={p.id} />
                <MiniField label="Nombre" name="name" defaultValue={p.name} className="col-span-2" />
                <MiniField label="SKU" name="sku" defaultValue={p.sku} />
                <MiniField label="Color" name="color_name" defaultValue={p.color_name} />
                <MiniField label="Hex" name="color_hex" defaultValue={p.color_hex} />
                <MiniField label="Hex 2" name="color_hex_secondary" defaultValue={p.color_hex_secondary ?? ""} />
                <MiniField label="Medidas" name="dimensions" defaultValue={p.dimensions} className="col-span-2" />
                <MiniField label="Bultos" name="packages" type="number" defaultValue={String(p.packages)} />
                <MiniField label="Precio" name="price" type="number" step="0.01" defaultValue={String(p.price)} />
                <MiniField label="Orden" name="sort_order" type="number" defaultValue={String(p.sort_order)} />
                <label className="text-xs flex items-center gap-2">
                  <input type="checkbox" name="active" defaultChecked={p.active} /> Activa
                </label>
                <div className="col-span-2 flex justify-between items-center pt-2">
                  <SubmitButton
                    formAction={deleteProductAction}
                    pendingText="Eliminando…"
                    className="text-red-600 text-xs font-semibold"
                  >
                    Eliminar
                  </SubmitButton>
                  <SubmitButton
                    pendingText="Guardando…"
                    className="px-3 py-1.5 bg-[#0047BB] text-white font-semibold text-xs rounded-md"
                  >
                    Guardar
                  </SubmitButton>
                </div>
              </form>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

function MiniField({
  label,
  name,
  type = "text",
  defaultValue,
  className = "",
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  className?: string;
  step?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-semibold text-zinc-500 mb-1 uppercase tracking-wider">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        step={step}
        className="w-full px-2 py-1.5 border border-zinc-300 rounded text-xs"
      />
    </div>
  );
}
