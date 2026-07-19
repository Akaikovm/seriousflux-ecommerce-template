/**
 * Pure inventory helpers only (no Firestore).
 * Side-effect modules: import `./validate-checkout-inventory` or
 * `./inventory-order-hooks` directly.
 */

export {
  isPurchasable,
  maxPurchasableQuantity,
  resolveInventoryStatus,
} from "./stock-status";
export {
  resolveStorefrontAvailability,
  shouldShowInCatalog,
  type StorefrontAvailability,
} from "./storefront-availability";
