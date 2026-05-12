"use client";

import { useState } from "react";

export type ColorOption = {
  name: string;
  hex: string;
  hex2: string | null;
};

type Props = {
  colors: ColorOption[];
  defaultName?: string;
  defaultHex?: string;
  defaultHex2?: string | null;
};

// Color picker that submits 3 form fields:
//   color_name, color_hex, color_hex_secondary
// Mode "existing": dropdown picks from previously-used colors,
// hex/hex2 auto-fill via hidden inputs.
// Mode "new": three free-text inputs.
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

  const selected = colors[idx];

  if (colors.length === 0) {
    // No colors in DB yet — fall back to manual
    return <ManualFields defaultName={defaultName} defaultHex={defaultHex} defaultHex2={defaultHex2} />;
  }

  return (
    <div>
      {mode === "existing" ? (
        <div className="space-y-2">
          <div className="relative">
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
                </option>
              ))}
            </select>
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
