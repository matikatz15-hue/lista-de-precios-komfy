import { revalidatePath, updateTag } from "next/cache";

export const PRICE_LIST_TAG = "price-list";

// Call from every admin action that modifies lines/groups/products/settings.
// updateTag has read-your-own-writes semantics (Next.js 16) — after the action
// returns, the admin sees their change immediately.
export function invalidatePriceList() {
  updateTag(PRICE_LIST_TAG);
  revalidatePath("/");
}
