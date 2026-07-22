import type { CartItem } from "@/features/cart/types";
import type { OrderItem } from "@/features/orders/types";

/**
 * Maps cart line snapshots to order line snapshots.
 *
 * Prefer `revalidateCheckoutCart` at purchase time (GAP-006) — that path uses
 * live catalog prices. This mapper remains for display-only / legacy callers.
 */
export function mapCartItemsToOrderItems(items: CartItem[]): OrderItem[] {
  return items.map((item) => ({
    productId: item.productId,
    productName: item.name,
    image: item.image,
    quantity: item.quantity,
    unitPrice: item.price,
  }));
}
