import { createClient } from "@/lib/supabase/server";
import type { Line, ProductGroup, Product, Settings, LineWithGroups, Condition } from "@/lib/types";

export async function getPriceList(): Promise<{ lines: LineWithGroups[]; settings: Settings }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { lines: [], settings: defaultSettings() };
  }

  let lines: Line[] = [];
  let groups: ProductGroup[] = [];
  let products: Product[] = [];
  let settings: Settings = defaultSettings();

  try {
    const supabase = await createClient();
    const [linesRes, groupsRes, productsRes, settingsRes] = await Promise.all([
      supabase.from("lines").select("*").eq("active", true).order("sort_order"),
      supabase.from("product_groups").select("*").order("sort_order"),
      supabase.from("products").select("*").eq("active", true).order("sort_order"),
      supabase.from("settings").select("*").eq("id", 1).single(),
    ]);

    lines = (linesRes.data ?? []) as Line[];
    groups = (groupsRes.data ?? []) as ProductGroup[];
    products = (productsRes.data ?? []) as Product[];
    if (settingsRes.data) settings = settingsRes.data as Settings;
  } catch (err) {
    console.error("getPriceList error", err);
  }

  const linesWithGroups: LineWithGroups[] = lines.map((line) => ({
    ...line,
    groups: groups
      .filter((g) => g.line_id === line.id)
      .map((group) => ({
        ...group,
        products: products.filter((p) => p.product_group_id === group.id),
      })),
  }));

  return { lines: linesWithGroups, settings };
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
