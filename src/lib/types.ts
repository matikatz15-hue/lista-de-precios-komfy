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

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "client";
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type DiscountType = "general" | "line" | "product";

export type Discount = {
  id: string;
  client_id: string;
  type: DiscountType;
  line_id: string | null;
  product_id: string | null;
  percent: number;
  created_at: string;
};

// Product with discount applied (publicPrice = original price; finalPrice = price after discount)
export type PricedProduct = Product & {
  finalPrice: number;
  discountPercent: number | null;
};

export type PricedGroup = ProductGroup & {
  products: PricedProduct[];
};

export type PricedLine = Line & {
  groups: PricedGroup[];
};

export type Viewer =
  | { kind: "public" }
  | { kind: "client"; profile: Profile }
  | { kind: "admin"; profile: Profile }
  | { kind: "preview"; admin: Profile; client: Profile };
