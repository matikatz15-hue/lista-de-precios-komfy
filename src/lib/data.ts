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
} from "@/lib/types";
import { applyDiscount, buildDiscountLookup, discountFor } from "@/lib/price";

const CATALOG_TTL = 3600; // 1h fallback; tag invalidation kicks in on admin edits

// Cookieless anon client used inside unstable_cache (RLS allows public reads).
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

export async function getPriceList(opts?: { previewClientId?: string }): Promise<{
  lines: PricedLine[];
  settings: Settings;
  viewer: Viewer;
}> {
  const empty = {
    lines: [] as PricedLine[],
    settings: defaultSettings(),
    viewer: { kind: "public" } as Viewer,
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    // Static catalog data — cached, fast
    const { lines, groups, products, settings } = await getCachedCatalog();

    // Auth + discounts data — dynamic, only when needed
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    let discounts: Discount[] = [];
    if (clientIdForDiscounts) {
      const { data } = await supabase
        .from("discounts")
        .select("*")
        .eq("client_id", clientIdForDiscounts);
      discounts = (data ?? []) as Discount[];
    }

    const lookup = buildDiscountLookup(discounts);

    const pricedLines: PricedLine[] = lines.map((line) => ({
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

    return { lines: pricedLines, settings, viewer };
  } catch (err) {
    console.error("getPriceList error", err);
    return empty;
  }
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
