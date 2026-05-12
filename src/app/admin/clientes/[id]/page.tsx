import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Discount, Line, Product } from "@/lib/types";
import { SubmitButton } from "@/components/SubmitButton";
import { BackLink } from "@/components/BackLink";
import {
  updateClientAction,
  resetPasswordAction,
  deleteClientAction,
  upsertGeneralDiscountAction,
  upsertLineDiscountAction,
  addProductDiscountAction,
  deleteDiscountAction,
} from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; msg?: string }>;
};

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error, msg } = await searchParams;
  const supabase = await createClient();

  const [profileRes, discountsRes, linesRes, productsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("discounts").select("*").eq("client_id", id),
    supabase.from("lines").select("*").eq("active", true).order("sort_order"),
    supabase.from("products").select("*, product_groups (line_id, name)").eq("active", true).order("sort_order"),
  ]);

  if (profileRes.error || !profileRes.data) notFound();
  const profile = profileRes.data as Profile;
  if (profile.role !== "client") notFound();

  const discounts = (discountsRes.data ?? []) as Discount[];
  const lines = (linesRes.data ?? []) as Line[];
  const products = (productsRes.data ?? []) as (Product & {
    product_groups: { line_id: string; name: string } | null;
  })[];

  const general = discounts.find((d) => d.type === "general");
  const lineDiscounts = new Map(
    discounts.filter((d) => d.type === "line").map((d) => [d.line_id!, d])
  );
  const productDiscounts = discounts.filter((d) => d.type === "product");
  const productById = new Map(products.map((p) => [p.id, p]));

  return (
    <div>
      <BackLink href="/admin/clientes" label="Volver a Clientes" />
      <nav className="text-sm text-zinc-500 mb-2">
        <Link href="/admin/clientes" className="hover:text-zinc-700">
          Clientes
        </Link>{" "}
        / <span className="text-zinc-900 font-semibold">{profile.full_name || profile.email}</span>
      </nav>
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">{profile.full_name || profile.email}</h1>
        <Link
          href={`/?preview=${profile.id}`}
          target="_blank"
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-md"
        >
          Ver lista como {profile.full_name?.split(" ")[0] || "este cliente"} ↗
        </Link>
      </div>

      {msg && (
        <div className="mb-6 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          {msg}
        </div>
      )}
      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Datos */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Datos</h2>
        <form action={updateClientAction} className="grid grid-cols-2 gap-4">
          <input type="hidden" name="id" value={profile.id} />
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Email (no editable)
            </label>
            <input
              value={profile.email}
              disabled
              className="w-full px-3 py-2 border border-zinc-200 rounded-md text-sm bg-zinc-50 text-zinc-500"
            />
          </div>
          <FieldText label="Nombre" name="full_name" defaultValue={profile.full_name ?? ""} className="col-span-2" />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={profile.active} />
            Cliente activo (puede entrar al sistema)
          </label>
          <div className="col-span-2 flex justify-between">
            <SubmitButton
              formAction={deleteClientAction}
              pendingText="Eliminando…"
              className="text-red-600 hover:text-red-700 text-sm font-semibold"
            >
              Eliminar cliente
            </SubmitButton>
            <SubmitButton
              pendingText="Guardando…"
              className="px-4 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
            >
              Guardar
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* Reset password */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
        <h2 className="font-semibold mb-4">Resetear contraseña</h2>
        <form action={resetPasswordAction} className="flex gap-2">
          <input type="hidden" name="id" value={profile.id} />
          <input
            name="new_password"
            type="text"
            placeholder="nueva contraseña"
            required
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-md text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-900 text-white font-semibold text-sm rounded-md"
          >
            Actualizar
          </button>
        </form>
      </section>

      {/* Descuento general */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
        <h2 className="font-semibold mb-1">Descuento general</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Aplica a todos los productos salvo que tengan descuento por línea o por producto (esos pisan al general).
        </p>
        <form action={upsertGeneralDiscountAction} className="flex gap-2 items-center">
          <input type="hidden" name="client_id" value={profile.id} />
          <input
            name="percent"
            type="number"
            step="0.01"
            placeholder="ej. 16.5"
            defaultValue={general?.percent ?? ""}
            className="w-32 px-3 py-2 border border-zinc-300 rounded-md text-sm"
          />
          <span className="text-zinc-500">% de descuento</span>
          <button
            type="submit"
            className="ml-auto px-4 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
          >
            Guardar
          </button>
        </form>
        <p className="text-xs text-zinc-400 mt-2">Dejá vacío para quitar el descuento general.</p>
      </section>

      {/* Descuentos por línea */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 mb-6">
        <h2 className="font-semibold mb-1">Descuentos por línea</h2>
        <p className="text-xs text-zinc-500 mb-4">Pisan al descuento general para los productos de esa línea.</p>
        <div className="space-y-2">
          {lines.map((line) => {
            const d = lineDiscounts.get(line.id);
            return (
              <form
                key={line.id}
                action={upsertLineDiscountAction}
                className="flex items-center gap-3 py-1.5 border-b border-zinc-100 last:border-0"
              >
                <input type="hidden" name="client_id" value={profile.id} />
                <input type="hidden" name="line_id" value={line.id} />
                <div className="w-28 font-semibold text-sm">{line.name}</div>
                <input
                  name="percent"
                  type="number"
                  step="0.01"
                  placeholder="vacío = sin descuento de línea"
                  defaultValue={d?.percent ?? ""}
                  className="w-40 px-3 py-1.5 border border-zinc-300 rounded-md text-sm"
                />
                <span className="text-zinc-500 text-sm">% off</span>
                <button
                  type="submit"
                  className="ml-auto px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs rounded-md"
                >
                  Guardar
                </button>
              </form>
            );
          })}
        </div>
      </section>

      {/* Descuentos por producto */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 mb-10">
        <h2 className="font-semibold mb-1">Descuentos por producto</h2>
        <p className="text-xs text-zinc-500 mb-4">
          Tope de la jerarquía: pisan al descuento de línea y al general para ese SKU específico.
        </p>

        <div className="space-y-1.5 mb-5">
          {productDiscounts.length === 0 ? (
            <p className="text-sm text-zinc-400 italic">Sin descuentos por producto.</p>
          ) : (
            productDiscounts.map((d) => {
              const p = productById.get(d.product_id!);
              if (!p) return null;
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-3 py-1.5 border-b border-zinc-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-zinc-500 font-mono">
                      {p.sku} · {p.color_name}
                    </div>
                  </div>
                  <div className="font-mono text-sm font-semibold text-[#0047BB]">
                    −{Number(d.percent).toFixed(2).replace(/\.?0+$/, "")}%
                  </div>
                  <form action={deleteDiscountAction}>
                    <input type="hidden" name="id" value={d.id} />
                    <input type="hidden" name="client_id" value={profile.id} />
                    <button type="submit" className="text-red-600 hover:text-red-700 text-xs font-semibold">
                      Quitar
                    </button>
                  </form>
                </div>
              );
            })
          )}
        </div>

        <form action={addProductDiscountAction} className="flex flex-wrap gap-2 items-center pt-3 border-t border-zinc-100">
          <input type="hidden" name="client_id" value={profile.id} />
          <select
            name="product_id"
            required
            className="flex-1 min-w-[280px] px-3 py-2 border border-zinc-300 rounded-md text-sm"
          >
            <option value="">— elegí un producto —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.color_name} ({p.sku})
              </option>
            ))}
          </select>
          <input
            name="percent"
            type="number"
            step="0.01"
            placeholder="%"
            required
            className="w-24 px-3 py-2 border border-zinc-300 rounded-md text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
          >
            Agregar
          </button>
        </form>
      </section>
    </div>
  );
}

function FieldText({
  label,
  name,
  defaultValue,
  className = "",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
      />
    </div>
  );
}
