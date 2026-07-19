/**
 * Inventory feature public surface (RFC-023).
 *
 * Prefer direct module imports for side-effect helpers so Client Components
 * do not pull Firestore through this barrel:
 * - `@/features/inventory/lib/validate-checkout-inventory`
 * - `@/features/inventory/lib/inventory-order-hooks`
 * - `@/features/inventory/services`
 */

export type {
  AdjustStockInput,
  AvailabilityInput,
  AvailabilityResult,
  CommitSaleItem,
  InventoryCommitStatus,
  InventoryRecord,
  InventoryStatus,
  SetQuantityInput,
} from "./types";

export { InventoryError, InventoryService } from "./services";
