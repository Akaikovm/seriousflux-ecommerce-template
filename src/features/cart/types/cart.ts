/**
 * Cart domain types (RFC-009).
 *
 * Cart is client-side only. Line items snapshot product display fields at
 * add-to-cart time so the cart page does not re-fetch ProductService.
 * Firebase persistence and checkout belong to later RFCs.
 */

/**
 * A single line in the shopping cart.
 *
 * `productId` links back to the catalog; name/slug/image/price/currency are
 * denormalized display snapshots (same idea as future OrderItem snapshots).
 */
export interface CartItem {
  /** Reference to `products/{productId}`. */
  productId: string;

  /** Product name snapshot. */
  name: string;

  /** URL-safe slug for linking back to the product detail page. */
  slug: string;

  /** Primary image URL snapshot. */
  image: string;

  /**
   * Unit price snapshot in the product currency's minor-unaware decimal form
   * (e.g. `49999` for ARS).
   */
  price: number;

  /** ISO 4217 currency code snapshot (e.g. `"ARS"`). */
  currency: string;

  /** Quantity in the cart (always >= 1 when present). */
  quantity: number;
}

/**
 * Shopping cart aggregate.
 *
 * Stored in Zustand + localStorage. Not a Firestore document in RFC-009.
 */
export interface Cart {
  items: CartItem[];
}

/**
 * Payload for adding a product to the cart.
 * Quantity defaults to `1` when omitted.
 */
export type AddToCartInput = Omit<CartItem, "quantity"> & {
  quantity?: number;
};
