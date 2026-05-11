import type { Discount } from "./types";

export type DiscountLookup = {
  general: number | null;
  byLine: Map<string, number>;
  byProduct: Map<string, number>;
};

export function buildDiscountLookup(discounts: Discount[]): DiscountLookup {
  const result: DiscountLookup = {
    general: null,
    byLine: new Map(),
    byProduct: new Map(),
  };
  for (const d of discounts) {
    const pct = Number(d.percent);
    if (d.type === "general") result.general = pct;
    else if (d.type === "line" && d.line_id) result.byLine.set(d.line_id, pct);
    else if (d.type === "product" && d.product_id) result.byProduct.set(d.product_id, pct);
  }
  return result;
}

// Returns the most specific applicable discount percent, or null if none.
// Precedence: product > line > general.
// Positive percent = discount (cliente paga menos).
export function discountFor(
  productId: string,
  lineId: string,
  lookup: DiscountLookup
): number | null {
  if (lookup.byProduct.has(productId)) return lookup.byProduct.get(productId)!;
  if (lookup.byLine.has(lineId)) return lookup.byLine.get(lineId)!;
  if (lookup.general !== null) return lookup.general;
  return null;
}

export function applyDiscount(price: number, percent: number | null): number {
  if (percent === null) return price;
  return price * (1 - percent / 100);
}

export function hasAnyDiscount(lookup: DiscountLookup): boolean {
  return (
    lookup.general !== null || lookup.byLine.size > 0 || lookup.byProduct.size > 0
  );
}
