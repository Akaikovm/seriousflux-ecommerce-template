import type {
  OrderPaymentStatus,
  OrderStatus,
  OrderWritableStatus,
} from "@/features/orders/types";

/**
 * Canonical fulfillment statuses used for transition checks and Admin filters.
 * Legacy aliases (`pending`, `delivered`, `refunded`) normalize into these.
 */
export type OrderCanonicalStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

const ORDER_STATUS_LABELS: Record<OrderCanonicalStatus, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<OrderPaymentStatus, string> = {
  pending: "Pending",
  authorized: "Authorized",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

/**
 * Allowed next fulfillment statuses from a canonical status (RFC-014).
 *
 * Flow: pending_payment → paid → processing → shipped → completed
 * Cancel: from pending_payment or paid only.
 */
const ALLOWED_TRANSITIONS: Record<OrderCanonicalStatus, OrderWritableStatus[]> =
  {
    pending_payment: ["paid", "cancelled"],
    paid: ["processing", "cancelled"],
    processing: ["shipped"],
    shipped: ["completed"],
    completed: [],
    cancelled: [],
  };

/**
 * Normalizes legacy stored statuses onto the canonical write vocabulary.
 * - `pending` → `pending_payment`
 * - `delivered` → `completed`
 * - `refunded` (order-level) → `cancelled`
 */
export function normalizeOrderStatus(status: OrderStatus): OrderCanonicalStatus {
  switch (status) {
    case "pending":
    case "pending_payment":
      return "pending_payment";
    case "delivered":
    case "completed":
      return "completed";
    case "refunded":
      return "cancelled";
    case "paid":
    case "processing":
    case "shipped":
    case "cancelled":
      return status;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Human-readable fulfillment label (legacy values display as their canonical form). */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[normalizeOrderStatus(status)];
}

/** Human-readable payment label. */
export function getPaymentStatusLabel(status: OrderPaymentStatus): string {
  return PAYMENT_STATUS_LABELS[status];
}

/** Next allowed writable statuses from the current stored status. */
export function getAllowedOrderTransitions(
  current: OrderStatus,
): OrderWritableStatus[] {
  return [...ALLOWED_TRANSITIONS[normalizeOrderStatus(current)]];
}

/**
 * Whether moving from `from` to `to` is allowed.
 * Same canonical status is treated as a no-op (allowed).
 */
export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderWritableStatus,
): boolean {
  const fromCanonical = normalizeOrderStatus(from);
  if (fromCanonical === to) {
    return true;
  }
  return ALLOWED_TRANSITIONS[fromCanonical].includes(to);
}

/** Filter options for Admin list (canonical only). */
export function getOrderStatusFilterOptions(): {
  value: OrderCanonicalStatus;
  label: string;
}[] {
  return (Object.keys(ORDER_STATUS_LABELS) as OrderCanonicalStatus[]).map(
    (value) => ({ value, label: ORDER_STATUS_LABELS[value] }),
  );
}

/** Payment statuses Admin may set manually (RFC-014; before Mercado Pago). */
export function getAdminPaymentStatusOptions(): {
  value: OrderPaymentStatus;
  label: string;
}[] {
  return (
    ["pending", "authorized", "paid", "failed", "refunded"] as const
  ).map((value) => ({
    value,
    label: PAYMENT_STATUS_LABELS[value],
  }));
}

/**
 * Select options for the next fulfillment status (current + allowed targets).
 */
export function getOrderStatusSelectOptions(current: OrderStatus): {
  value: OrderWritableStatus;
  label: string;
}[] {
  const canonical = normalizeOrderStatus(current);
  const targets = new Set<OrderWritableStatus>([
    canonical,
    ...getAllowedOrderTransitions(current),
  ]);

  return Array.from(targets).map((value) => ({
    value,
    label: ORDER_STATUS_LABELS[value],
  }));
}
