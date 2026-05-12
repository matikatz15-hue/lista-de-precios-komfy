"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setProductPrice, applyPriceToGroup } from "../../products/actions";

type SiblingPrice = { id: string; price: number };

type Props = {
  productId: string;
  groupId: string;
  currentPrice: number;
  siblings: SiblingPrice[]; // other products in the same group (not this one)
};

function formatARS(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InlinePriceCell({ productId, groupId, currentPrice, siblings }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [propagatePrompt, setPropagatePrompt] = useState<{
    newPrice: number;
    siblingsToUpdate: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus the input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function save(rawValue: string) {
    setError(null);
    const num = Number(rawValue.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(num) || num < 0) {
      setError("Precio inválido");
      return;
    }
    if (num === currentPrice) {
      setEditing(false);
      return;
    }

    startTransition(async () => {
      const res = await setProductPrice(productId, num);
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar");
        return;
      }
      setEditing(false);

      // Decide whether to ask about propagation
      const siblingsToUpdate = siblings.filter((s) => Number(s.price) !== num).length;
      if (siblingsToUpdate > 0) {
        setPropagatePrompt({ newPrice: num, siblingsToUpdate });
      } else {
        router.refresh();
      }
    });
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      save(e.currentTarget.value);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
      setError(null);
    }
  }

  function handlePropagate(yes: boolean) {
    if (!propagatePrompt) return;
    const { newPrice } = propagatePrompt;
    setPropagatePrompt(null);

    if (yes) {
      startTransition(async () => {
        await applyPriceToGroup(groupId, newPrice);
        router.refresh();
      });
    } else {
      router.refresh();
    }
  }

  return (
    <div className="relative inline-block">
      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={pending}
          className={`font-mono font-semibold text-right inline-block px-2 py-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 cursor-text transition-colors ${
            pending ? "opacity-60" : ""
          }`}
          title="Click para editar"
        >
          ${formatARS(currentPrice)}
        </button>
      ) : (
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          defaultValue={currentPrice}
          onKeyDown={handleKey}
          onBlur={(e) => save(e.currentTarget.value)}
          disabled={pending}
          className="w-32 px-2 py-1 text-right font-mono font-semibold border-2 border-blue-500 rounded bg-white outline-none"
        />
      )}

      {pending && (
        <span className="ml-2 text-[10px] uppercase tracking-wider text-zinc-500">guardando…</span>
      )}

      {error && (
        <div className="absolute right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-30">
          {error}
        </div>
      )}

      {propagatePrompt && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => handlePropagate(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl rounded-xl border border-zinc-200 p-6 w-[420px] max-w-[calc(100vw-24px)] z-50 text-left"
          >
            <div className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-1">
              Precio actualizado
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">
              ¿Aplicar ${formatARS(propagatePrompt.newPrice)} a las otras{" "}
              {propagatePrompt.siblingsToUpdate}{" "}
              {propagatePrompt.siblingsToUpdate === 1 ? "variante" : "variantes"} del grupo?
            </h3>
            <p className="text-sm text-zinc-600 mb-5">
              Casi siempre todas las variantes del mismo producto tienen el mismo precio. Si querés
              propagar el cambio, dale Sí.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handlePropagate(false)}
                disabled={pending}
                className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-semibold text-sm rounded-md"
              >
                No, solo esta
              </button>
              <button
                type="button"
                onClick={() => handlePropagate(true)}
                disabled={pending}
                className="px-4 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
              >
                {pending ? "Aplicando…" : `Sí, aplicar a ${propagatePrompt.siblingsToUpdate}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
