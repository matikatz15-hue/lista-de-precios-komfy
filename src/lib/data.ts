import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();

    const [linesRes, groupsRes, productsRes, settingsRes, userRes] = await Promise.all([
      supabase.from("lines").select("*").eq("active", true).order("sort_order"),
      supabase.from("product_groups").select("*").order("sort_order"),
      supabase.from("products").select("*").eq("active", true).order("sort_order"),
      supabase.from("settings").select("*").eq("id", 1).single(),
      supabase.auth.getUser(),
    ]);

    const lines = (linesRes.data ?? []) as Line[];
    const groups = (groupsRes.data ?? []) as ProductGroup[];
    const products = (productsRes.data ?? []) as Product[];
    const settings = (settingsRes.data ?? defaultSettings()) as Settings;
    const user = userRes.data.user;

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
