import { resolveInventoryStatus } from "@/features/inventory/lib/stock-status";
import type { InventoryStatus } from "@/features/inventory/types";
import type { Product } from "@/features/products/types";

/**
 * Serializable product row for Admin products list (RFC-023).
 * Keep this module free of `"use client"` so Server Components can map rows.
 */
export type AdminProductRow = Product & {
  stockQuantity: number | null;
  inventoryStatus: InventoryStatus;
};

export function toAdminProductRow(
  product: Product,
  stockQuantity: number | null,
): AdminProductRow {
  const quantity = stockQuantity ?? 0;
  return {
    ...product,
    stockQuantity: product.trackInventory ? quantity : null,
    inventoryStatus: resolveInventoryStatus({
      trackInventory: product.trackInventory,
      quantity,
      lowStockThreshold: product.lowStockThreshold,
    }),
  };
}
