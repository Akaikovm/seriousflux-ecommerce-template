import {
  isPurchasable,
  maxPurchasableQuantity,
  resolveInventoryStatus,
} from "./stock-status";
import type { InventoryStatus } from "@/features/inventory/types";
import type { Product } from "@/features/products/types";
import type { InventorySettings } from "@/features/settings/types";

export type StorefrontAvailability = {
  status: InventoryStatus;
  quantity: number | null;
  canPurchase: boolean;
  maxQuantity: number | null;
  /** Show “Only X left” when settings allow and status is low_stock. */
  showRemaining: boolean;
  /** Out of stock / backorder / remaining-stock copy. */
  availabilityLabel: string | null;
  hideAddToCart: boolean;
};

/**
 * Builds storefront availability from product policy + inventory quantity.
 */
export function resolveStorefrontAvailability(input: {
  product: Pick<
    Product,
    | "trackInventory"
    | "allowBackorders"
    | "visibilityWhenOutOfStock"
    | "lowStockThreshold"
  >;
  quantity: number;
  inventorySettings?: Pick<
    InventorySettings,
    "showRemainingStock" | "hideOutOfStockProducts"
  >;
}): StorefrontAvailability {
  const { product, quantity, inventorySettings } = input;
  const status = resolveInventoryStatus({
    trackInventory: product.trackInventory,
    quantity,
    lowStockThreshold: product.lowStockThreshold,
  });

  const canPurchase = isPurchasable({
    trackInventory: product.trackInventory,
    quantity,
    allowBackorders: product.allowBackorders,
  });

  const maxQuantity = maxPurchasableQuantity({
    trackInventory: product.trackInventory,
    quantity,
    allowBackorders: product.allowBackorders,
  });

  const showRemaining =
    Boolean(inventorySettings?.showRemainingStock) &&
    status === "low_stock" &&
    product.trackInventory;

  let availabilityLabel: string | null = null;
  if (product.trackInventory && quantity <= 0) {
    availabilityLabel = product.allowBackorders
      ? "Available on backorder"
      : "Out of stock";
  } else if (showRemaining) {
    availabilityLabel = `Only ${quantity} left`;
  }

  const hideAddToCart =
    product.trackInventory &&
    !canPurchase &&
    product.visibilityWhenOutOfStock === "hidden";

  return {
    status,
    quantity: product.trackInventory ? quantity : null,
    canPurchase,
    maxQuantity,
    showRemaining,
    availabilityLabel,
    hideAddToCart,
  };
}

/**
 * Whether a product should appear in catalog listings.
 */
export function shouldShowInCatalog(input: {
  product: Pick<
    Product,
    | "active"
    | "trackInventory"
    | "allowBackorders"
    | "visibilityWhenOutOfStock"
  >;
  quantity: number;
  hideOutOfStockProducts: boolean;
}): boolean {
  if (!input.product.active) {
    return false;
  }

  if (!input.product.trackInventory) {
    return true;
  }

  const outOfStock =
    input.quantity <= 0 && !input.product.allowBackorders;

  if (!outOfStock) {
    return true;
  }

  if (input.product.visibilityWhenOutOfStock === "hidden") {
    return false;
  }

  if (input.hideOutOfStockProducts) {
    return false;
  }

  return true;
}
