import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateLineAction, deleteLineAction } from "../actions";
import { createGroupAction } from "../../groups/actions";
import type { Line, ProductGroup, Product } from "@/lib/types";
import { getPublicImageUrl } from "@/lib/storage";

export default async function LineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [lineRes, groupsRes, productCountRes] = await Promise.all([
    supabase.from("lines").select("*").eq("id", id).single(),
    supabase.from("product_groups").select("*").eq("line_id", id).order("sort_order"),
    supabase.from("products").select("id, product_group_id").eq("active", true),
  ]);

  if (lineRes.error || !lineRes.data) notFound();

  const line = lineRes.data as Line;
  const groups = (groupsRes.data ?? []) as ProductGroup[];
  const products = (productCountRes.data ?? []) as Pick<Product, "id" | "product_group_id">[];

  const productsByGroup = new Map<string, number>();
  for (const p of products) {
    productsByGroup.set(p.product_group_id, (productsByGroup.get(p.product_group_id) ?? 0) + 1);
  }

  return (
    <div>
      <nav className="text-sm text-zinc-500 mb-2">
        <Link href="/admin/lines" className="hover:text-zinc-700">
          Líneas
        </Link>{" "}
        / <span className="text-zinc-900 font-semibold">{line.name}</span>
      </nav>
      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Editar línea</h1>

      <section className="bg-white rounded-xl border border-zinc-200 p-6 mb-8">
        <h2 className="font-semibold mb-4">Datos de la línea</h2>
        <form action={updateLineAction} className="grid grid-cols-2 gap-4">
          <input type="hidden" name="id" value={line.id} />
          <Field label="Nombre" name="name" defaultValue={line.name} required />
          <Field label="Número" name="number" type="number" defaultValue={String(line.number)} required />
          <Field label="Slug" name="slug" defaultValue={line.slug} required />
          <Field label="Orden" name="sort_order" type="number" defaultValue={String(line.sort_order)} />
          <Field label="Eyebrow" name="eyebrow" defaultValue={line.eyebrow ?? ""} className="col-span-2" />
          <Field
            label="Descripción"
            name="description"
            defaultValue={line.description ?? ""}
            textarea
            className="col-span-2"
          />
          <Field
            label="Letra a destacar"
            name="highlight_letter"
            defaultValue={line.highlight_letter ?? ""}
            maxLength={1}
          />
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Estilo banner
            </label>
            <select
              name="banner_style"
              defaultValue={line.banner_style}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
            >
              <option value="blue">Azul</option>
              <option value="cream">Crema</option>
            </select>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={line.active} />
            Línea activa (visible en la lista pública)
          </label>
          <div className="col-span-2 flex justify-between items-center">
            <button
              type="submit"
              formAction={deleteLineAction}
              className="text-red-600 hover:text-red-700 text-sm font-semibold"
            >
              Eliminar línea
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </section>

      <section>
        <header className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900">Grupos de productos</h2>
        </header>

        <div className="bg-white rounded-xl border border-zinc-200 mb-6 overflow-hidden">
          {groups.length === 0 ? (
            <div className="p-8 text-center text-sm text-zinc-500">
              Sin grupos todavía. Creá el primero abajo (ej. &quot;Rack TV&quot;, &quot;Estantería&quot;).
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Foto</th>
                  <th className="text-left px-4 py-3 font-semibold">Grupo</th>
                  <th className="text-left px-4 py-3 font-semibold">Medidas</th>
                  <th className="text-left px-4 py-3 font-semibold">Variantes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => {
                  const url = g.thumbnail_path ? getPublicImageUrl(g.thumbnail_path) : null;
                  return (
                    <tr key={g.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-zinc-200" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold">{g.name}</td>
                      <td className="px-4 py-3 text-zinc-600">{g.base_dimensions ?? "—"}</td>
                      <td className="px-4 py-3">{productsByGroup.get(g.id) ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/groups/${g.id}`}
                          className="text-[#0047BB] font-semibold hover:underline text-xs uppercase tracking-wider"
                        >
                          Productos →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <h3 className="font-semibold mb-4">Nuevo grupo de productos</h3>
          <form action={createGroupAction} className="grid grid-cols-2 gap-4">
            <input type="hidden" name="line_id" value={line.id} />
            <Field label="Nombre (ej: Rack TV)" name="name" required className="col-span-2" />
            <Field label="Medidas base (ej: 38 × 143,7 × 95,6 cm)" name="base_dimensions" />
            <Field label="Etiqueta meta (ej: 6 terminaciones)" name="meta_label" />
            <Field label="Orden" name="sort_order" type="number" defaultValue="0" />
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
                Foto del grupo
              </label>
              <input
                type="file"
                name="thumbnail"
                accept="image/*"
                className="block text-sm"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
              >
                Crear grupo
              </button>
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
  textarea,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  textarea?: boolean;
  maxLength?: number;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
        />
      )}
    </div>
  );
}
