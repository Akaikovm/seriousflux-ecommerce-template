/**
 * Transactional notification events (RFC-019).
 * Aligns with future domain event names (OrderCreated, PaymentApproved, …)
 * without implementing an event bus in this RFC.
 */
export type NotificationEvent =
  | "order.created"
  | "payment.approved"
  | "payment.failed"
  | "order.cancelled"
  | "order.shipped"
  | "admin.order.created"
  | "admin.payment.received"
  | "account.welcome";

/** Dispatch payloads accepted by `POST /api/notifications/dispatch`. */
export type NotificationDispatchInput =
  | { event: "order.created"; orderId: string }
  | { event: "payment.approved"; orderId: string }
  | { event: "payment.failed"; orderId: string }
  | { event: "order.cancelled"; orderId: string }
  | { event: "order.shipped"; orderId: string }
  | {
      event: "account.welcome";
      email: string;
      displayName?: string;
      customerId?: string;
    };

/**
 * High-level triggers that may fan out to customer + admin templates.
 * Used by the dispatch route / NotificationService.
 */
export type NotificationTrigger =
  | { type: "order.created"; orderId: string }
  | { type: "payment.approved"; orderId: string }
  | { type: "payment.failed"; orderId: string }
  | { type: "order.cancelled"; orderId: string }
  | { type: "order.shipped"; orderId: string }
  | {
      type: "account.welcome";
      email: string;
      displayName?: string;
      customerId?: string;
    };
