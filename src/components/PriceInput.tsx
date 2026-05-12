"use client";

import { useState } from "react";
import { formatAR, formatInputAR, parseAR } from "@/lib/price-format";

type Props = {
  name: string;
  defaultValue?: number | string | null;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

// Argentina-style price input.
// Shows "$ 1.234.567,89" while the user types; submits the underlying
// numeric value (point-decimal) under the given name via a hidden input,
// so server actions can do `Number(formData.get(name))` as usual.
export function PriceInput({
  name,
  defaultValue,
  required,
  placeholder = "0,00",
  className = "",
}: Props) {
  const initial =
    defaultValue !== undefined && defaultValue !== null && defaultValue !== ""
      ? formatAR(Number(defaultValue))
      : "";
  const [display, setDisplay] = useState(initial);

  const numeric = parseAR(display);
  const submitValue = Number.isFinite(numeric) ? String(numeric) : "";

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono font-semibold pointer-events-none select-none">
        $
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(e) => setDisplay(formatInputAR(e.target.value))}
        placeholder={placeholder}
        required={required}
        className={`w-full pl-7 pr-3 py-2 border border-zinc-300 rounded-md text-sm text-right font-mono ${className}`}
      />
      <input type="hidden" name={name} value={submitValue} />
    </div>
  );
}
