/**
 * Product document.
 *
 * Collection: `products`
 *
 * Field names match Firestore 1:1 (RFC-007 / RFC-023). Variants (sizes / colors /
 * per-variant stock) are intentionally deferred — keep the first catalog
 * version simple and reusable across clients.
 *
 * Commercial catalog + selling policy live here.
 * Quantity lives in `inventory/{productId}` via InventoryService — never on Product.
 */
export type ProductSize = string;

/**
 * A selectable color option.
 *
 * Reserved for order line-item snapshots and a future variants RFC.
 * Product catalog v1 (RFC-007) does not expose colors on `Product`.
 */
export interface ProductColor {
  /** Human-readable color name (e.g. `"Navy"`). */
  name: string;

  /** CSS hex value for swatches (e.g. `"#001F3F"`). */
  hex: string;
}

/** Storefront visibility when tracked stock is exhausted. */
export type ProductOutOfStockVisibility = "visible" | "hidden";

export interface Product {
  /** Firestore document id. */
  id: string;

  /** Display name (e.g. `"Camisa Oxford Blanca"`). */
  name: string;

  /** URL-safe unique slug (e.g. `"camisa-oxford-blanca"`). */
  slug: string;

  /** Full product description shown on the detail page. */
  description: string;

  /** Primary product image URL (Firestore field: `image`). */
  image: string;

  /**
   * Unit price in the product currency's minor-unaware decimal form
   * (e.g. `49999` for ARS).
   */
  price: number;

  /** ISO 4217 currency code stored on the product (e.g. `"ARS"`). */
  currency: string;

  /**
   * Reference to `categories/{categoryId}`.
   * Products belong to exactly one category in v1.
   */
  categoryId: string;

  /**
   * When true, eligible for homepage / highlight surfaces.
   * Firestore field: `featured`.
   */
  featured: boolean;

  /** When false, the product is hidden from the storefront. Firestore field: `active`. */
  active: boolean;

  /**
   * Manual sort order for catalog listing and featured grids.
   * Lower values appear first. Firestore field: `order`.
   */
  order: number;

  /**
   * Commercial SKU. Snapshotted onto order line items when present.
   * Optional — omitted on legacy documents.
   */
  sku?: string;

  /**
   * When true, InventoryService enforces quantity.
   * Missing on legacy documents → treated as `false` (backward compatible).
   * New products default to `true` on create (ADR-023).
   */
  trackInventory: boolean;

  /** Badge / widget threshold when tracking inventory. */
  lowStockThreshold: number;

  /** When true, checkout may proceed even if quantity ≤ 0. */
  allowBackorders: boolean;

  /** Listing/PDP behavior when out of stock (tracked, no backorders). */
  visibilityWhenOutOfStock: ProductOutOfStockVisibility;
}

/**
 * Fields required to create a product document (RFC-011 / RFC-023).
 * `id` is assigned by Firestore (or an explicit id on create).
 */
export type ProductWriteInput = {
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  categoryId: string;
  featured: boolean;
  active: boolean;
  order: number;
  sku?: string;
  /** Defaults to `true` when omitted on create (ADR-023). */
  trackInventory?: boolean;
  lowStockThreshold?: number;
  allowBackorders?: boolean;
  visibilityWhenOutOfStock?: ProductOutOfStockVisibility;
};

/** Partial update payload for admin product edits. */
export type ProductUpdateInput = Partial<ProductWriteInput>;
