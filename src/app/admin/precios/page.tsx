import { Fragment } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InlinePriceCell } from "../groups/[id]/InlinePriceCell";
import type { Line, ProductGroup, Product } from "@/lib/types";

export default async function PreciosPage() {
  const supabase = await createClient();

  const [linesRes, groupsRes, productsRes] = await Promise.all([
    supabase.from("lines").select("*").order("sort_order"),
    supabase.from("product_groups").select("*").order("sort_order"),
    supabase.from("products").select("*").order("sort_order"),
  ]);

  const lines = (linesRes.data ?? []) as Line[];
  const groups = (groupsRes.data ?? []) as ProductGroup[];
  const products = (productsRes.data ?? []) as Product[];

  // Group products by group_id for sibling computation
  const productsByGroup = new Map<string, Product[]>();
  for (const p of products) {
    const arr = productsByGroup.get(p.product_group_id) ?? [];
    arr.push(p);
    productsByGroup.set(p.product_group_id, arr);
  }

  // Build a flat tree: line → groups → products
  const tree = lines.map((line) => ({
    line,
    groups: groups
      .filter((g) => g.line_id === line.id)
      .map((g) => ({
        group: g,
        products: productsByGroup.get(g.id) ?? [],
      })),
  }));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900">Precios</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Todos los productos en una sola pantalla. Click sobre un precio para editar; te
          pregunta si querés aplicarlo a las otras variantes del grupo.
        </p>
      </header>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 sticky top-0 z-10">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Producto</th>
              <th className="text-left px-3 py-3 font-semibold">SKU</th>
              <th className="text-left px-3 py-3 font-semibold">Color</th>
              <th className="text-left px-3 py-3 font-semibold">Medidas</th>
              <th className="text-right px-3 py-3 font-semibold">Bul.</th>
              <th className="text-right px-3 py-3 font-semibold">Precio (click para editar)</th>
            </tr>
          </thead>
          <tbody>
            {tree.map(({ line, groups: lineGroups }) => (
              <Fragment key={line.id}>
                <LineHeaderRow line={line} />
                {lineGroups.map(({ group, products: groupProducts }) => (
                  <Fragment key={group.id}>
                    <GroupHeaderRow group={group} count={groupProducts.length} />
                    {groupProducts.map((p) => (
                      <ProductPriceRow
                        key={p.id}
                        product={p}
                        groupId={group.id}
                        siblings={groupProducts
                          .filter((s) => s.id !== p.id)
                          .map((s) => ({ id: s.id, price: Number(s.price) }))}
                      />
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LineHeaderRow({ line }: { line: Line }) {
  return (
    <tr className="bg-[#0047BB] text-white">
      <td colSpan={6} className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-widest text-orange-300 uppercase">
            Línea {String(line.number).padStart(2, "0")}
          </span>
          <span className="font-bold text-base">{line.name}</span>
          {line.description && (
            <span className="text-xs text-white/70 truncate">{line.description}</span>
          )}
        </div>
      </td>
    </tr>
  );
}

function GroupHeaderRow({ group, count }: { group: ProductGroup; count: number }) {
  return (
    <tr className="bg-zinc-100">
      <td colSpan={6} className="px-4 py-2">
        <div className="flex items-center gap-2 text-zinc-700">
          <span className="font-semibold text-sm">{group.name}</span>
          <span className="text-xs text-zinc-500">·</span>
          <span className="text-xs text-zinc-500">{count} variantes</span>
          <Link
            href={`/admin/groups/${group.id}`}
            className="ml-auto text-[#0047BB] text-xs font-semibold uppercase tracking-wider hover:underline"
          >
            Abrir grupo →
          </Link>
        </div>
      </td>
    </tr>
  );
}

function ProductPriceRow({
  product: p,
  groupId,
  siblings,
}: {
  product: Product;
  groupId: string;
  siblings: { id: string; price: number }[];
}) {
  const swatchStyle: React.CSSProperties = p.color_hex_secondary
    ? { background: `linear-gradient(135deg, ${p.color_hex} 50%, ${p.color_hex_secondary} 50%)` }
    : { background: p.color_hex };

  return (
    <tr className="border-t border-zinc-100 hover:bg-zinc-50">
      <td className="px-4 py-2.5 text-sm">{p.name}</td>
      <td className="px-3 py-2.5 font-mono text-xs text-[#0047BB] whitespace-nowrap">{p.sku}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span
            className="inline-block w-3 h-3 rounded-full border border-black/20 flex-shrink-0"
            style={swatchStyle}
            aria-hidden
          />
          <span className="text-xs">{p.color_name}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs text-zinc-600 whitespace-nowrap">{p.dimensions}</td>
      <td className="px-3 py-2.5 text-right text-sm">{p.packages}</td>
      <td className="px-3 py-2.5 text-right">
        <InlinePriceCell
          productId={p.id}
          groupId={groupId}
          currentPrice={Number(p.price)}
          siblings={siblings}
        />
      </td>
    </tr>
  );
}

