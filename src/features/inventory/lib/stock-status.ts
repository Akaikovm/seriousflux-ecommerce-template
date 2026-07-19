import type { InventoryStatus } from "@/features/inventory/types";

/**
 * Pure stock status helper (no I/O). Used by InventoryService and Admin badges.
 */
export function resolveInventoryStatus(input: {
  trackInventory: boolean;
  quantity: number;
  lowStockThreshold: number;
}): InventoryStatus {
  if (!input.trackInventory) {
    return "not_tracked";
  }

  if (input.quantity <= 0) {
    return "out_of_stock";
  }

  const threshold = Math.max(0, input.lowStockThreshold);
  if (input.quantity <= threshold) {
    return "low_stock";
  }

  return "in_stock";
}

/**
 * Whether the storefront may sell this line given policy + quantity.
 */
export function isPurchasable(input: {
  trackInventory: boolean;
  quantity: number;
  allowBackorders: boolean;
}): boolean {
  if (!input.trackInventory) {
    return true;
  }
  if (input.quantity > 0) {
    return true;
  }
  return input.allowBackorders;
}

/**
 * Max units the cart may hold for a tracked product (null = unlimited).
 */
export function maxPurchasableQuantity(input: {
  trackInventory: boolean;
  quantity: number;
  allowBackorders: boolean;
}): number | null {
  if (!input.trackInventory) {
    return null;
  }
  if (input.allowBackorders) {
    return null;
  }
  return Math.max(0, input.quantity);
}
