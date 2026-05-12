"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setProductPrice, applyPriceToGroup } from "../../products/actions";
import { formatAR, formatInputAR, parseAR } from "@/lib/price-format";

type SiblingPrice = { id: string; price: number };

type Props = {
  productId: string;
  groupId: string;
  currentPrice: number;
  siblings: SiblingPrice[];
};

type ConfirmPrompt = {
  newPrice: number;
  siblingsToUpdate: number;
};

export function InlinePriceCell({ productId, groupId, currentPrice, siblings }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(formatAR(currentPrice));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmPrompt, setConfirmPrompt] = useState<ConfirmPrompt | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEdit() {
    setInputValue(formatAR(currentPrice));
    setEditing(true);
    setError(null);
  }

  // Step 1 of the flow: don't save yet, just ask the user to confirm.
  function askConfirmation() {
    setError(null);
    const num = parseAR(inputValue);
    if (!Number.isFinite(num) || num < 0) {
      setError("Precio inválido");
      return;
    }
    if (num === currentPrice) {
      setEditing(false);
      return;
    }
    const siblingsToUpdate = siblings.filter((s) => Number(s.price) !== num).length;
    setEditing(false);
    setConfirmPrompt({ newPrice: num, siblingsToUpdate });
  }

  function cancelPrompt() {
    setConfirmPrompt(null);
    setInputValue(formatAR(currentPrice));
  }

  function applyOnlyThis() {
    if (!confirmPrompt) return;
    const { newPrice } = confirmPrompt;
    setConfirmPrompt(null);
    startTransition(async () => {
      const res = await setProductPrice(productId, newPrice);
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar");
        return;
      }
      router.refresh();
    });
  }

  function applyAll() {
    if (!confirmPrompt) return;
    const { newPrice } = confirmPrompt;
    setConfirmPrompt(null);
    startTransition(async () => {
      const res = await applyPriceToGroup(groupId, newPrice);
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar");
        return;
      }
      router.refresh();
    });
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      askConfirmation();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setInputValue(formatAR(currentPrice));
      setEditing(false);
      setError(null);
    }
  }

  const totalVariants = siblings.length + 1;

  return (
    <div className="relative inline-block">
      {!editing ? (
        <button
          type="button"
          onClick={startEdit}
          disabled={pending}
          className={`font-mono font-semibold text-right inline-block px-2 py-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 cursor-text transition-colors ${
            pending ? "opacity-60" : ""
          }`}
          title="Click para editar"
        >
          ${formatAR(currentPrice)}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1">
          <span className="text-zinc-500 font-mono font-semibold">$</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => setInputValue(formatInputAR(e.target.value))}
            onKeyDown={handleKey}
            onBlur={askConfirmation}
            disabled={pending}
            placeholder="0,00"
            className="w-40 px-2 py-1 text-right font-mono font-semibold border-2 border-blue-500 rounded bg-white outline-none"
          />
        </span>
      )}

      {pending && (
        <span className="ml-2 text-[10px] uppercase tracking-wider text-zinc-500">guardando…</span>
      )}

      {error && (
        <div className="absolute right-0 mt-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 z-30 whitespace-nowrap">
          {error}
        </div>
      )}

      {confirmPrompt && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={cancelPrompt}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl rounded-xl border border-zinc-200 p-6 w-[460px] max-w-[calc(100vw-24px)] z-50 text-left"
          >
            <div className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-1">
              Confirmar cambio de precio
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4 mt-3">
              <div className="bg-zinc-50 rounded-md p-3 border border-zinc-200">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
                  Anterior
                </div>
                <div className="font-mono font-semibold text-zinc-600 line-through">
                  ${formatAR(currentPrice)}
                </div>
              </div>
              <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 mb-1">
                  Nuevo
                </div>
                <div className="font-mono font-bold text-[#0047BB]">
                  ${formatAR(confirmPrompt.newPrice)}
                </div>
              </div>
            </div>
            {confirmPrompt.siblingsToUpdate > 0 ? (
              <p className="text-sm text-zinc-600 mb-5">
                Las otras {confirmPrompt.siblingsToUpdate}{" "}
                {confirmPrompt.siblingsToUpdate === 1 ? "variante" : "variantes"} del grupo tienen
                otro precio. ¿Querés aplicar el cambio solo a esta o a las {totalVariants} del
                grupo?
              </p>
            ) : (
              <p className="text-sm text-zinc-600 mb-5">¿Confirmás el cambio?</p>
            )}
            <div className="flex justify-end gap-2 flex-wrap">
              <button
                type="button"
                onClick={cancelPrompt}
                disabled={pending}
                className="px-4 py-2 bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-semibold text-sm rounded-md"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={applyOnlyThis}
                disabled={pending}
                className={`px-4 py-2 font-semibold text-sm rounded-md ${
                  confirmPrompt.siblingsToUpdate > 0
                    ? "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                    : "bg-[#0047BB] hover:bg-[#003691] text-white"
                }`}
              >
                {confirmPrompt.siblingsToUpdate > 0 ? "Solo esta" : "Confirmar"}
              </button>
              {confirmPrompt.siblingsToUpdate > 0 && (
                <button
                  type="button"
                  onClick={applyAll}
                  disabled={pending}
                  className="px-4 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
                >
                  Aplicar a las {totalVariants} del grupo
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
