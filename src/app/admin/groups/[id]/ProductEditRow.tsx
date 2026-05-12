"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { PriceInput } from "@/components/PriceInput";
import { ColorPicker, type ColorOption } from "@/components/ColorPicker";
import { updateProductAction, deleteProductAction } from "../../products/actions";
import { InlinePriceCell } from "./InlinePriceCell";
import type { Product } from "@/lib/types";

type Sibling = { id: string; price: number };

type Props = {
  product: Product;
  groupId: string;
  siblings: Sibling[];
  palette: ColorOption[];
};

export function ProductEditRow({ product: p, groupId, siblings, palette }: Props) {
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
      <td className="px-3 py-3 text-right">
        <InlinePriceCell
          productId={p.id}
          groupId={groupId}
          currentPrice={Number(p.price)}
          siblings={siblings}
        />
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
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setEditing(false)}
              aria-hidden
            />
            {/* Modal */}
            <div
              role="dialog"
              aria-modal="true"
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl rounded-xl border border-zinc-200 p-6 w-[460px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-24px)] overflow-y-auto z-50 text-left"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
                <div>
                  <div className="text-xs font-bold tracking-widest text-orange-500 uppercase">Editar variante</div>
                  <div className="font-semibold text-base text-zinc-900 mt-0.5">{p.name}</div>
                  <div className="text-xs font-mono text-zinc-500 mt-0.5">{p.sku}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  aria-label="Cerrar"
                  className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <form action={updateProductAction} className="grid grid-cols-2 gap-3">
                <input type="hidden" name="id" value={p.id} />
                <MiniField label="Nombre" name="name" defaultValue={p.name} className="col-span-2" />
                <MiniField label="SKU" name="sku" defaultValue={p.sku} className="col-span-2" />
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-zinc-500 mb-1 uppercase tracking-wider">
                    Color
                  </label>
                  <ColorPicker
                    colors={palette}
                    defaultName={p.color_name}
                    defaultHex={p.color_hex}
                    defaultHex2={p.color_hex_secondary}
                  />
                </div>
                <MiniField label="Medidas" name="dimensions" defaultValue={p.dimensions} className="col-span-2" />
                <MiniField label="Bultos" name="packages" type="number" defaultValue={String(p.packages)} />
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 mb-1 uppercase tracking-wider">
                    Precio
                  </label>
                  <PriceInput name="price" defaultValue={p.price} />
                </div>
                <MiniField label="Orden" name="sort_order" type="number" defaultValue={String(p.sort_order)} />
                <label className="text-xs flex items-center gap-2 pt-1">
                  <input type="checkbox" name="active" defaultChecked={p.active} /> Activa
                </label>
                <div className="col-span-2 flex justify-between items-center pt-3 border-t border-zinc-100 mt-2">
                  <SubmitButton
                    formAction={deleteProductAction}
                    pendingText="Eliminando…"
                    className="text-red-600 hover:text-red-700 text-xs font-semibold uppercase tracking-wider"
                  >
                    Eliminar
                  </SubmitButton>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-3 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-semibold text-xs rounded-md"
                    >
                      Cancelar
                    </button>
                    <SubmitButton
                      pendingText="Guardando…"
                      className="px-4 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-xs rounded-md"
                    >
                      Guardar
                    </SubmitButton>
                  </div>
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
