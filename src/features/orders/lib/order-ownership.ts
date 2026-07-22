import type { Order } from "@/features/orders/types";

/**
 * Whether an order is owned by the given customer id (RFC-018).
 * Empty / missing ids never match — same fail-closed posture as getForCustomer.
 */
export function orderBelongsToCustomer(
  order: Pick<Order, "customerId"> | null | undefined,
  customerId: string,
): boolean {
  if (!order) {
    return false;
  }

  const ownerId = customerId.trim();
  return Boolean(ownerId && order.customerId && order.customerId === ownerId);
}
