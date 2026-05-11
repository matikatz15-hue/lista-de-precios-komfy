export type Line = {
  id: string;
  slug: string;
  name: string;
  number: number;
  eyebrow: string | null;
  description: string | null;
  highlight_letter: string | null;
  banner_style: "blue" | "cream";
  sort_order: number;
  active: boolean;
  created_at: string;
};

export type ProductGroup = {
  id: string;
  line_id: string;
  name: string;
  base_dimensions: string | null;
  meta_label: string | null;
  thumbnail_path: string | null;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  product_group_id: string;
  name: string;
  sku: string;
  color_name: string;
  color_hex: string;
  color_hex_secondary: string | null;
  dimensions: string;
  packages: number;
  price: number;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Condition = {
  icon: string;
  label: string;
  sublabel?: string;
  value: string;
  hot?: boolean;
};

export type Settings = {
  id: number;
  period_label: string | null;
  effective_date: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  website_url: string | null;
  cover_subtitle: string | null;
  intro_title: string | null;
  intro_body: string | null;
  stat_lines: number | null;
  stat_skus: number | null;
  stat_finishes: number | null;
  conditions: Condition[];
  updated_at: string;
};

export type LineWithGroups = Line & {
  groups: (ProductGroup & { products: Product[] })[];
};
