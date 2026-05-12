import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateGroupAction, deleteGroupAction } from "../actions";
import { createProductAction } from "../../products/actions";
import { getPublicImageUrl } from "@/lib/storage";
import { SubmitButton } from "@/components/SubmitButton";
import { BackLink } from "@/components/BackLink";
import { FileUpload } from "@/components/FileUpload";
import { PriceInput } from "@/components/PriceInput";
import { ColorPicker, type ColorOption } from "@/components/ColorPicker";
import { ProductEditRow } from "./ProductEditRow";
import type { ProductGroup, Product, Line } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function GroupDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const supabase = await createClient();

  const [groupRes, productsRes, colorPaletteRes] = await Promise.all([
    supabase.from("product_groups").select("*, lines (*)").eq("id", id).single(),
    supabase.from("products").select("*").eq("product_group_id", id).order("sort_order"),
    supabase
      .from("products")
      .select("color_name, color_hex, color_hex_secondary")
      .order("color_name"),
  ]);

  if (groupRes.error || !groupRes.data) notFound();

  const group = groupRes.data as ProductGroup & { lines: Line };
  const products = (productsRes.data ?? []) as Product[];
  const thumbUrl = group.thumbnail_path ? getPublicImageUrl(group.thumbnail_path) : null;

  // Distinct color palette across the whole catalog, with usage count
  const colorMap = new Map<string, ColorOption>();
  for (const cp of colorPaletteRes.data ?? []) {
    const c = cp as { color_name: string; color_hex: string; color_hex_secondary: string | null };
    const key = `${c.color_name}__${c.color_hex}__${c.color_hex_secondary ?? ""}`;
    const existing = colorMap.get(key);
    if (existing) {
      existing.count = (existing.count ?? 0) + 1;
    } else {
      colorMap.set(key, {
        name: c.color_name,
        hex: c.color_hex,
        hex2: c.color_hex_secondary,
        count: 1,
      });
    }
  }
  const palette = Array.from(colorMap.values());

  return (
    <div>
      <BackLink href={`/admin/lines/${group.line_id}`} label={`Volver a ${group.lines.name}`} />
      <nav className="text-sm text-zinc-500 mb-2">
        <Link href="/admin/lines" className="hover:text-zinc-700">
          Líneas
        </Link>{" "}
        /{" "}
        <Link href={`/admin/lines/${group.line_id}`} className="hover:text-zinc-700">
          {group.lines.name}
        </Link>{" "}
        / <span className="text-zinc-900 font-semibold">{group.name}</span>
      </nav>
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Editar grupo</h1>

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

      <section className="bg-white rounded-xl border border-zinc-200 p-6 mb-8">
        <h2 className="font-semibold mb-4">Datos del grupo</h2>
        <form action={updateGroupAction} className="grid grid-cols-2 gap-4">
          <input type="hidden" name="id" value={group.id} />
          <Field label="Nombre" name="name" defaultValue={group.name} required className="col-span-2" />
          <Field
            label="Medidas base"
            name="base_dimensions"
            defaultValue={group.base_dimensions ?? ""}
          />
          <Field label="Etiqueta meta" name="meta_label" defaultValue={group.meta_label ?? ""} />
          <Field label="Orden" name="sort_order" type="number" defaultValue={String(group.sort_order)} />
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Foto del grupo
            </label>
            <FileUpload
              name="thumbnail"
              currentImageUrl={thumbUrl}
              helperText="Si no querés cambiar la foto, dejá este campo como está."
            />
          </div>
          <div className="col-span-2 flex justify-between items-center">
            <SubmitButton
              formAction={deleteGroupAction}
              pendingText="Eliminando…"
              className="text-red-600 hover:text-red-700 text-sm font-semibold"
            >
              Eliminar grupo
            </SubmitButton>
            <SubmitButton
              pendingText="Guardando…"
              className="px-5 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
            >
              Guardar cambios
            </SubmitButton>
          </div>
        </form>
      </section>

      <section>
        <header className="mb-4">
          <h2 className="text-xl font-bold text-zinc-900">Variantes / SKUs</h2>
          <p className="text-sm text-zinc-600 mt-1">Cada variante es una fila en la lista de precios (color + medidas + precio).</p>
        </header>

        <div className="bg-white rounded-xl border border-zinc-200 mb-6 overflow-hidden">
          {products.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">Sin variantes todavía.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="text-left px-3 py-3">Producto</th>
                  <th className="text-left px-3 py-3">SKU</th>
                  <th className="text-left px-3 py-3">Color</th>
                  <th className="text-left px-3 py-3">Medidas</th>
                  <th className="text-right px-3 py-3">Bul.</th>
                  <th className="text-right px-3 py-3">Precio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <ProductEditRow
                    key={p.id}
                    product={p}
                    groupId={group.id}
                    palette={palette}
                    siblings={products
                      .filter((s) => s.id !== p.id)
                      .map((s) => ({ id: s.id, price: Number(s.price) }))}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h3 className="font-semibold mb-4">Nueva variante</h3>
          <form action={createProductAction} className="grid grid-cols-6 gap-3">
            <input type="hidden" name="product_group_id" value={group.id} />
            <Field
              label="Nombre"
              name="name"
              required
              className="col-span-3"
              defaultValue={group.name}
            />
            <Field label="SKU" name="sku" required className="col-span-3" />
            <div className="col-span-6">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                Color
              </label>
              <ColorPicker colors={palette} />
            </div>
            <Field
              label="Medidas (An × La × Al)"
              name="dimensions"
              required
              defaultValue={group.base_dimensions ?? ""}
              className="col-span-3"
            />
            <Field label="Bultos" name="packages" type="number" defaultValue="1" className="col-span-2" />
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                Precio
              </label>
              <PriceInput name="price" required />
            </div>
            <Field label="Orden" name="sort_order" type="number" defaultValue="0" className="col-span-2" />
            <div className="col-span-6 flex justify-end">
              <SubmitButton
                pendingText="Agregando…"
                className="px-5 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
              >
                Agregar variante
              </SubmitButton>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  className = "",
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  step?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={step}
        className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
      />
    </div>
  );
}

