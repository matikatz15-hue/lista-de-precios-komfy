"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePaletteColor } from "@/app/admin/products/actions";

export type ColorOption = {
  name: string;
  hex: string;
  hex2: string | null;
  count?: number; // optional: how many variants currently use this color
};

type Props = {
  colors: ColorOption[];
  defaultName?: string;
  defaultHex?: string;
  defaultHex2?: string | null;
};

export function ColorPicker({
  colors,
  defaultName,
  defaultHex,
  defaultHex2,
}: Props) {
  const initialIdx = defaultName
    ? colors.findIndex(
        (c) =>
          c.name === defaultName &&
          c.hex.toLowerCase() === (defaultHex ?? "").toLowerCase() &&
          (c.hex2 ?? "").toLowerCase() === (defaultHex2 ?? "").toLowerCase()
      )
    : -1;
  const hasDefaultName = !!defaultName;
  const matched = initialIdx !== -1;
  const [mode, setMode] = useState<"existing" | "new">(
    hasDefaultName && !matched ? "new" : "existing"
  );
  const [idx, setIdx] = useState<number>(matched ? initialIdx : 0);
  const [editing, setEditing] = useState(false);

  const selected = colors[idx];

  if (colors.length === 0) {
    return (
      <ManualFields
        defaultName={defaultName}
        defaultHex={defaultHex}
        defaultHex2={defaultHex2}
      />
    );
  }

  return (
    <div>
      {mode === "existing" ? (
        <div className="space-y-2">
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-black/15"
                style={
                  selected?.hex2
                    ? {
                        background: `linear-gradient(135deg, ${selected.hex} 50%, ${selected.hex2} 50%)`,
                      }
                    : { background: selected?.hex ?? "#999" }
                }
              />
              <select
                value={idx}
                onChange={(e) => setIdx(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-md text-sm bg-white appearance-none"
              >
                {colors.map((c, i) => (
                  <option key={i} value={i}>
                    {c.name}
                    {c.hex2 ? "  · bicolor" : ""}
                    {c.count ? `  (${c.count})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-xs font-semibold uppercase tracking-wider rounded-md whitespace-nowrap"
              title="Editar este color en todas las variantes que lo usan"
            >
              ✎ Editar
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMode("new")}
            className="text-xs font-semibold text-[#0047BB] hover:underline"
          >
            + Crear color nuevo
          </button>
          <input type="hidden" name="color_name" value={selected?.name ?? ""} />
          <input type="hidden" name="color_hex" value={selected?.hex ?? ""} />
          <input
            type="hidden"
            name="color_hex_secondary"
            value={selected?.hex2 ?? ""}
          />

          {editing && selected && (
            <EditColorModal
              color={selected}
              onClose={() => setEditing(false)}
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <ManualFields
            defaultName={defaultName}
            defaultHex={defaultHex}
            defaultHex2={defaultHex2}
          />
          <button
            type="button"
            onClick={() => setMode("existing")}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:underline"
          >
            ← Elegir uno existente
          </button>
        </div>
      )}
    </div>
  );
}

function EditColorModal({
  color,
  onClose,
}: {
  color: ColorOption;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(color.name);
  const [hex, setHex] = useState(color.hex);
  const [hex2, setHex2] = useState(color.hex2 ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updatePaletteColor({
        oldName: color.name,
        oldHex: color.hex,
        oldHex2: color.hex2,
        newName: name,
        newHex: hex,
        newHex2: hex2 || null,
      });
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl rounded-xl border border-zinc-200 p-6 w-[440px] max-w-[calc(100vw-24px)] z-50 text-left"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
          <div>
            <div className="text-xs font-bold tracking-widest text-orange-500 uppercase">
              Editar color
            </div>
            <div className="font-semibold text-base text-zinc-900 mt-0.5 flex items-center gap-2">
              <span
                className="inline-block w-5 h-5 rounded-full border border-black/15"
                style={
                  hex2
                    ? { background: `linear-gradient(135deg, ${hex} 50%, ${hex2} 50%)` }
                    : { background: hex }
                }
              />
              {color.name}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
                Hex principal
              </label>
              <div className="flex items-stretch gap-1">
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  className="w-12 h-10 p-1 border border-zinc-300 rounded-md cursor-pointer"
                />
                <input
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  placeholder="#1C1C1C"
                  className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 uppercase tracking-wider">
                Hex 2 (bicolor)
              </label>
              <div className="flex items-stretch gap-1">
                <input
                  type="color"
                  value={hex2 || "#ffffff"}
                  onChange={(e) => setHex2(e.target.value)}
                  className="w-12 h-10 p-1 border border-zinc-300 rounded-md cursor-pointer"
                />
                <input
                  value={hex2}
                  onChange={(e) => setHex2(e.target.value)}
                  placeholder="(opcional)"
                  className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {color.count !== undefined && color.count > 0 && (
          <p className="text-xs text-zinc-600 mt-4 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            ⚠️ Este cambio se va a aplicar a las{" "}
            <strong>{color.count} variantes</strong> que usan este color.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-600 mt-3 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-semibold text-sm rounded-md"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="px-4 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </>
  );
}

function ManualFields({
  defaultName,
  defaultHex,
  defaultHex2,
}: {
  defaultName?: string;
  defaultHex?: string;
  defaultHex2?: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input
        name="color_name"
        defaultValue={defaultName ?? ""}
        placeholder="Nombre (ej. Verde militar)"
        required
        className="col-span-2 px-3 py-2 border border-zinc-300 rounded-md text-sm"
      />
      <input
        name="color_hex"
        defaultValue={defaultHex ?? ""}
        placeholder="Hex principal · #1C1C1C"
        required
        className="px-3 py-2 border border-zinc-300 rounded-md text-sm font-mono"
      />
      <input
        name="color_hex_secondary"
        defaultValue={defaultHex2 ?? ""}
        placeholder="Hex 2 (opcional) · #B58A5E"
        className="px-3 py-2 border border-zinc-300 rounded-md text-sm font-mono"
      />
    </div>
  );
}
