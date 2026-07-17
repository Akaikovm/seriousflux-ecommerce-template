import type {
  Order,
  OrderItem,
  OrderPaymentStatus,
  OrderShippingAddress,
  OrderShippingMethod,
  OrderStatus,
  OrderTotals,
  PaymentProviderId,
} from "@/features/orders/types";

/**
 * Serializable order shape for Admin UI (no Firestore Timestamp).
 * Safe to pass from Server Components to Client Components.
 */
export type AdminOrderView = {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress: OrderShippingAddress;
  shippingMethod: OrderShippingMethod;
  payment: {
    provider: PaymentProviderId;
    status: OrderPaymentStatus;
    externalId?: string;
    transactionId?: string;
    amount: number;
    currency: string;
    /** ISO 8601 when paid. */
    paidAt?: string;
  };
  totals: OrderTotals;
  currency: string;
  notes?: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
};

function toIso(timestamp: { toDate: () => Date }): string {
  return timestamp.toDate().toISOString();
}

/**
 * Maps a domain Order onto serializable Admin props (strips Timestamps).
 */
export function toAdminOrderView(order: Order): AdminOrderView {
  const view: AdminOrderView = {
    id: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status,
    items: order.items,
    shippingAddress: order.shippingAddress,
    shippingMethod: order.shippingMethod,
    payment: {
      provider: order.payment.provider,
      status: order.payment.status,
      amount: order.payment.amount,
      currency: order.payment.currency,
    },
    totals: order.totals,
    currency: order.currency,
    createdAt: toIso(order.createdAt),
    updatedAt: toIso(order.updatedAt),
  };

  if (order.customerId) {
    view.customerId = order.customerId;
  }
  if (order.notes) {
    view.notes = order.notes;
  }
  if (order.payment.externalId) {
    view.payment.externalId = order.payment.externalId;
  }
  if (order.payment.transactionId) {
    view.payment.transactionId = order.payment.transactionId;
  }
  if (order.payment.paidAt) {
    view.payment.paidAt = toIso(order.payment.paidAt);
  }

  return view;
}
