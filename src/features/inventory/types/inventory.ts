import type { Timestamp } from "firebase/firestore";

/**
 * Stock availability status derived from product policy + inventory quantity.
 *
 * Collection: logical domain only — quantity lives in `inventory/{productId}` (MVP).
 */
export type InventoryStatus =
  | "not_tracked"
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

/**
 * Idempotency + shortfall flag stored on the order (ADR-023).
 * Does not change OrderStatus / payment status enums.
 */
export type InventoryCommitStatus =
  | "none"
  | "committed"
  | "restored"
  | "shortfall";

/**
 * Inventory document — source of truth for sellable quantity (RFC-023).
 *
 * Path: `inventory/{productId}` (MVP storage; warehouse-aware keys may replace this later).
 * Callers must use InventoryService — never hardcode collection paths in UI.
 */
export interface InventoryRecord {
  /** Same as Firestore document id in MVP. */
  productId: string;

  /** Available sellable units (≥ 0). Never driven negative by commitSale. */
  quantity: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  /** Optional Admin uid for manual set/adjust (MVP optional). */
  updatedBy?: string;
}

/** Input for availability checks (checkout pass #1 and commitSale pass #2). */
export type AvailabilityInput = {
  productId: string;
  quantity: number;
  trackInventory: boolean;
  allowBackorders: boolean;
  /** Product-level threshold; falls back to service default when omitted. */
  lowStockThreshold?: number;
};

export type AvailabilityFailureReason =
  | "insufficient_stock"
  | "out_of_stock";

export type AvailabilityResult = {
  productId: string;
  ok: boolean;
  status: InventoryStatus;
  /** `null` when inventory is not tracked. */
  availableQuantity: number | null;
  reason?: AvailabilityFailureReason;
};

export type AdjustStockInput = {
  productId: string;
  delta: number;
  reason?: string;
  updatedBy?: string;
};

export type SetQuantityInput = {
  productId: string;
  quantity: number;
  updatedBy?: string;
};

export type CommitSaleItem = {
  productId: string;
  quantity: number;
};
