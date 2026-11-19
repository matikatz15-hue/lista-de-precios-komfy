"use client";

import { useState } from "react";
import { generarCodigoAction } from "@/app/admin/clientes/codigo-actions";
import { useReadOnly } from "@/components/ReadOnly";

const URL_LOGIN = "https://lista-de-precios-komfy.vercel.app/login";

// Botón "Generar código" del admin. Muestra el código una vez, con el mensaje listo para mandar.
export function CodigoActivacion({ userId, email }: { userId: string; email: string }) {
  const [res, setRes] = useState<{ codigo: string; minutos: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const readOnly = useReadOnly();

  async function generar() {
    if (readOnly) return;
    setError(null);
    setCopiado(false);
    setCargando(true);
    const r = await generarCodigoAction(userId);
    setCargando(false);
    if ("error" in r) setError(r.error);
    else setRes(r);
  }

  const mensaje = res
    ? `Para entrar a la lista de precios Komfy con tu huella o tu cara:\n1. Abrí ${URL_LOGIN}\n2. Tocá «Tengo un código para este dispositivo»\n3. Poné tu email (${email}) y este código: ${res.codigo}\nVence en ${res.minutos} minutos y sirve una sola vez.`
    : "";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
    } catch {
      setError("No se pudo copiar; copialo a mano.");
    }
  }

  return (
    <div className="mt-4">
      {res ? (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange-700">
            Código · vence en {res.minutos} min · sirve una vez
          </div>
          <div className="my-2 font-mono text-2xl font-bold tracking-wider text-zinc-900">{res.codigo}</div>
          <p className="text-sm text-zinc-600">
            Que lo ponga en el login, en «Tengo un código para este dispositivo», junto con su email. Este código no se
            vuelve a mostrar.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={copiar}
              className="rounded-md bg-[#0047BB] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#003691]"
            >
              {copiado ? "Mensaje copiado ✓" : "Copiar mensaje para mandar"}
            </button>
            <button
              type="button"
              onClick={generar}
              disabled={cargando}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-white"
            >
              Generar otro
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={generar}
          disabled={cargando}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
        >
          {cargando ? "Generando…" : "Generar código para activar huella o cara"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
