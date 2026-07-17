import type { CartItem } from "@/features/cart/types";
import type { OrderItem } from "@/features/orders/types";

/**
 * Maps cart line snapshots to order line snapshots.
 * Trusts cart prices for RFC-013 (revalidation deferred to payments).
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
