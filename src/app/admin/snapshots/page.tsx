import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/SubmitButton";
import {
  createSnapshotAction,
  renameSnapshotAction,
  deleteSnapshotAction,
} from "./actions";
import type { PriceSnapshot } from "@/lib/types";

type Props = { searchParams: Promise<{ saved?: string; error?: string }> };

export default async function SnapshotsPage({ searchParams }: Props) {
  const { saved, error } = await searchParams;
  const supabase = await createClient();

  const [snapshotsRes, itemCountRes] = await Promise.all([
    supabase
      .from("price_snapshots")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("price_snapshot_items").select("snapshot_id"),
  ]);

  const snapshots = (snapshotsRes.data ?? []) as PriceSnapshot[];
  const itemCounts = new Map<string, number>();
  for (const row of (itemCountRes.data ?? []) as { snapshot_id: string }[]) {
    itemCounts.set(row.snapshot_id, (itemCounts.get(row.snapshot_id) ?? 0) + 1);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900">Historial de versiones</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Guardá una &quot;foto&quot; de la lista en un momento dado. Los clientes logueados
          pueden ver versiones anteriores desde el header de la lista pública.
        </p>
      </header>

      {saved && (
        <div className="mb-6 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <span>✓</span>
          <span>{saved}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Create new snapshot */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 mb-8">
        <h2 className="font-semibold mb-1">Guardar versión actual</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Congela los precios actuales con un nombre. Después podés comparar.
        </p>
        <form action={createSnapshotAction} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Nombre
            </label>
            <input
              name="name"
              required
              placeholder="ej. Lista Mayo 2026"
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Fecha de vigencia (opcional)
            </label>
            <input
              name="effective_date"
              type="date"
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Notas (opcional)
            </label>
            <input
              name="notes"
              placeholder="ej. Aumento general +12%"
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
            />
          </div>
          <div className="col-span-2 flex justify-end">
            <SubmitButton
              pendingText="Guardando versión…"
              className="px-5 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
            >
              Guardar como nueva versión
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* List of snapshots */}
      <section className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        {snapshots.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-500">
            Todavía no guardaste ninguna versión. Cuando termines de actualizar precios,
            guardá una con un nombre claro (ej. &quot;Lista Mayo 2026&quot;).
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold">Vigencia</th>
                <th className="text-left px-4 py-3 font-semibold">Creado</th>
                <th className="text-left px-4 py-3 font-semibold">Productos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-semibold">{s.name}</td>
                  <td className="px-4 py-3 text-zinc-600 text-xs">
                    {s.effective_date ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(s.created_at).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">{itemCounts.get(s.id) ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <Link
                        href={`/?version=${s.id}`}
                        target="_blank"
                        className="text-[#0047BB] font-semibold hover:underline text-xs uppercase tracking-wider"
                      >
                        Ver lista ↗
                      </Link>
                      <details className="relative">
                        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-900 text-xs uppercase tracking-wider list-none px-2 py-1">
                          ⋯
                        </summary>
                        <div className="absolute right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg p-2 w-56 z-10">
                          <form action={renameSnapshotAction} className="flex gap-1 mb-1">
                            <input type="hidden" name="id" value={s.id} />
                            <input
                              name="name"
                              defaultValue={s.name}
                              className="flex-1 px-2 py-1 border border-zinc-300 rounded text-xs"
                            />
                            <SubmitButton
                              className="px-2 py-1 bg-zinc-800 text-white text-xs rounded"
                              pendingText="…"
                            >
                              ↻
                            </SubmitButton>
                          </form>
                          <form action={deleteSnapshotAction}>
                            <input type="hidden" name="id" value={s.id} />
                            <SubmitButton
                              pendingText="Eliminando…"
                              className="w-full px-2 py-1.5 text-red-600 hover:bg-red-50 rounded text-xs text-left"
                            >
                              Eliminar versión
                            </SubmitButton>
                          </form>
                        </div>
                      </details>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
