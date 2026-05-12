import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { PRICE_LIST_TAG } from "@/lib/cache";
import type {
  Line,
  ProductGroup,
  Product,
  Settings,
  Condition,
  Profile,
  Discount,
  PricedLine,
  Viewer,
  PriceSnapshot,
  PriceSnapshotItem,
} from "@/lib/types";
import { applyDiscount, buildDiscountLookup, discountFor } from "@/lib/price";

const CATALOG_TTL = 3600;

function catalogClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

const getCachedCatalog = unstable_cache(
  async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { lines: [], groups: [], products: [], settings: defaultSettings() };
    }
    const sb = catalogClient();
    const [linesRes, groupsRes, productsRes, settingsRes] = await Promise.all([
      sb.from("lines").select("*").eq("active", true).order("sort_order"),
      sb.from("product_groups").select("*").order("sort_order"),
      sb.from("products").select("*").eq("active", true).order("sort_order"),
      sb.from("settings").select("*").eq("id", 1).single(),
    ]);
    return {
      lines: (linesRes.data ?? []) as Line[],
      groups: (groupsRes.data ?? []) as ProductGroup[],
      products: (productsRes.data ?? []) as Product[],
      settings: (settingsRes.data ?? defaultSettings()) as Settings,
    };
  },
  ["catalog"],
  { tags: [PRICE_LIST_TAG], revalidate: CATALOG_TTL }
);

export async function getPriceList(opts?: {
  previewClientId?: string;
  snapshotId?: string;
}): Promise<{
  lines: PricedLine[];
  settings: Settings;
  viewer: Viewer;
  snapshot?: PriceSnapshot | null;
  availableSnapshots?: PriceSnapshot[];
}> {
  const empty = {
    lines: [] as PricedLine[],
    settings: defaultSettings(),
    viewer: { kind: "public" } as Viewer,
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Build viewer (same as before)
    let viewer: Viewer = { kind: "public" };
    let clientIdForDiscounts: string | null = null;
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      const profile = profileData as Profile | null;
      if (profile) {
        if (profile.role === "admin") {
          if (opts?.previewClientId) {
            const { data: clientData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", opts.previewClientId)
              .single();
            if (clientData) {
              viewer = { kind: "preview", admin: profile, client: clientData as Profile };
              clientIdForDiscounts = (clientData as Profile).id;
            } else {
              viewer = { kind: "admin", profile };
            }
          } else {
            viewer = { kind: "admin", profile };
          }
        } else {
          viewer = { kind: "client", profile };
          clientIdForDiscounts = profile.id;
        }
      }
    }

    // Discounts
    let discounts: Discount[] = [];
    if (clientIdForDiscounts) {
      const { data } = await supabase
        .from("discounts")
        .select("*")
        .eq("client_id", clientIdForDiscounts);
      discounts = (data ?? []) as Discount[];
    }
    const lookup = buildDiscountLookup(discounts);

    // List of snapshots — only authenticated users get this. Anonymous: empty list.
    let availableSnapshots: PriceSnapshot[] = [];
    if (user) {
      const { data: snapsData } = await supabase
        .from("price_snapshots")
        .select("*")
        .order("created_at", { ascending: false });
      availableSnapshots = (snapsData ?? []) as PriceSnapshot[];
    }

    // If a snapshot is requested AND the viewer is authenticated, render from snapshot
    let activeSnapshot: PriceSnapshot | null = null;
    if (opts?.snapshotId && user) {
      const { data: snap } = await supabase
        .from("price_snapshots")
        .select("*")
        .eq("id", opts.snapshotId)
        .single();
      if (snap) activeSnapshot = snap as PriceSnapshot;
    }

    let pricedLines: PricedLine[];
    let settings: Settings;

    if (activeSnapshot) {
      const { data: items } = await supabase
        .from("price_snapshot_items")
        .select("*")
        .eq("snapshot_id", activeSnapshot.id)
        .order("line_sort_order")
        .order("group_sort_order")
        .order("sort_order");
      pricedLines = buildPricedLinesFromSnapshot((items ?? []) as PriceSnapshotItem[], lookup);
      // Settings: keep current settings (period_label, contact, etc.) but show snapshot's effective date if available
      const { data: settingsData } = await supabase.from("settings").select("*").eq("id", 1).single();
      settings = (settingsData ?? defaultSettings()) as Settings;
      if (activeSnapshot.effective_date) {
        settings = { ...settings, effective_date: activeSnapshot.effective_date };
      }
      if (activeSnapshot.name) {
        settings = { ...settings, period_label: activeSnapshot.name };
      }
    } else {
      const { lines, groups, products, settings: cur } = await getCachedCatalog();
      settings = cur;
      pricedLines = lines.map((line) => ({
        ...line,
        groups: groups
          .filter((g) => g.line_id === line.id)
          .map((group) => ({
            ...group,
            products: products
              .filter((p) => p.product_group_id === group.id)
              .map((p) => {
                const percent = discountFor(p.id, line.id, lookup);
                return {
                  ...p,
                  price: Number(p.price),
                  finalPrice: applyDiscount(Number(p.price), percent),
                  discountPercent: percent,
                };
              }),
          })),
      }));
    }

    return {
      lines: pricedLines,
      settings,
      viewer,
      snapshot: activeSnapshot,
      availableSnapshots,
    };
  } catch (err) {
    console.error("getPriceList error", err);
    return empty;
  }
}

function buildPricedLinesFromSnapshot(
  items: PriceSnapshotItem[],
  lookup: ReturnType<typeof buildDiscountLookup>
): PricedLine[] {
  // Group items: line → group → products
  const lineMap = new Map<string, PricedLine>();
  for (const it of items) {
    const lineKey = it.line_id ?? it.line_slug;
    let line = lineMap.get(lineKey);
    if (!line) {
      line = {
        id: it.line_id ?? lineKey,
        slug: it.line_slug,
        name: it.line_name,
        number: it.line_number,
        eyebrow: it.line_eyebrow,
        description: it.line_description,
        highlight_letter: it.line_highlight_letter,
        banner_style: it.line_banner_style,
        sort_order: it.line_sort_order,
        active: true,
        created_at: it.created_at,
        groups: [],
      };
      lineMap.set(lineKey, line);
    }
    const groupKey = it.product_group_id ?? `${lineKey}__${it.group_name}`;
    let group = line.groups.find((g) => g.id === groupKey);
    if (!group) {
      group = {
        id: groupKey,
        line_id: line.id,
        name: it.group_name,
        base_dimensions: null,
        meta_label: null,
        thumbnail_path: it.group_thumbnail_path,
        sort_order: it.group_sort_order,
        created_at: it.created_at,
        products: [],
      };
      line.groups.push(group);
    }
    const productId = it.product_id ?? it.id;
    const percent = discountFor(productId, line.id, lookup);
    group.products.push({
      id: productId,
      product_group_id: group.id,
      name: it.product_name,
      sku: it.sku,
      color_name: it.color_name,
      color_hex: it.color_hex,
      color_hex_secondary: it.color_hex_secondary,
      dimensions: it.dimensions,
      packages: it.packages,
      price: Number(it.price),
      sort_order: it.sort_order,
      active: true,
      created_at: it.created_at,
      updated_at: it.created_at,
      finalPrice: applyDiscount(Number(it.price), percent),
      discountPercent: percent,
    });
  }
  return Array.from(lineMap.values()).sort((a, b) => a.sort_order - b.sort_order);
}

function defaultSettings(): Settings {
  return {
    id: 1,
    period_label: null,
    effective_date: null,
    contact_email: null,
    contact_phone: null,
    whatsapp: null,
    website_url: null,
    cover_subtitle: null,
    intro_title: null,
    intro_body: null,
    stat_lines: 0,
    stat_skus: 0,
    stat_finishes: 0,
    conditions: [] as Condition[],
    updated_at: new Date().toISOString(),
  };
}
