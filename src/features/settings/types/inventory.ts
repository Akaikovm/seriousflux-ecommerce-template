/**
 * Public inventory defaults on `settings/general` (RFC-023 / ADR-023).
 *
 * These are store-wide defaults for new products and catalog UX.
 * Per-product policy fields override where applicable.
 */

export interface InventorySettings {
  /** Default for newly created products (`trackInventory`). Kit default: true. */
  defaultTrackInventory: boolean;

  /** Default low-stock threshold for new products. */
  defaultLowStockThreshold: number;

  /** Default allow-backorders for new products. */
  defaultAllowBackorders: boolean;

  /** When true, catalog listings omit out-of-stock tracked products (no backorders). */
  hideOutOfStockProducts: boolean;

  /** When true, storefront may show “Only X left” for low stock. */
  showRemainingStock: boolean;
}

export const DEFAULT_INVENTORY_SETTINGS: InventorySettings = {
  defaultTrackInventory: true,
  defaultLowStockThreshold: 5,
  defaultAllowBackorders: false,
  hideOutOfStockProducts: false,
  showRemainingStock: true,
};

export function mapInventorySettings(
  raw: unknown,
  fallback: InventorySettings = DEFAULT_INVENTORY_SETTINGS,
): InventorySettings {
  const data =
    raw !== null && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};

  return {
    defaultTrackInventory:
      typeof data.defaultTrackInventory === "boolean"
        ? data.defaultTrackInventory
        : fallback.defaultTrackInventory,
    defaultLowStockThreshold:
      typeof data.defaultLowStockThreshold === "number" &&
      Number.isFinite(data.defaultLowStockThreshold)
        ? Math.max(0, Math.floor(data.defaultLowStockThreshold))
        : fallback.defaultLowStockThreshold,
    defaultAllowBackorders:
      typeof data.defaultAllowBackorders === "boolean"
        ? data.defaultAllowBackorders
        : fallback.defaultAllowBackorders,
    hideOutOfStockProducts:
      typeof data.hideOutOfStockProducts === "boolean"
        ? data.hideOutOfStockProducts
        : fallback.hideOutOfStockProducts,
    showRemainingStock:
      typeof data.showRemainingStock === "boolean"
        ? data.showRemainingStock
        : fallback.showRemainingStock,
  };
}
