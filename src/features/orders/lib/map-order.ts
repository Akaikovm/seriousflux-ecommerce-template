import {
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type {
  Order,
  OrderItem,
  OrderPayment,
  OrderPaymentStatus,
  OrderShippingAddress,
  OrderShippingMethod,
  OrderStatus,
  OrderTotals,
  PaymentProviderId,
} from "@/features/orders/types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asTimestamp(value: unknown, fallback: Timestamp): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }
  return fallback;
}

function asOptionalTimestamp(value: unknown): Timestamp | undefined {
  if (value instanceof Timestamp) {
    return value;
  }
  return undefined;
}

const ORDER_STATUSES: ReadonlySet<string> = new Set([
  "pending_payment",
  "pending",
  "paid",
  "processing",
  "shipped",
  "completed",
  "delivered",
  "cancelled",
  "refunded",
]);

const PAYMENT_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
]);

const PAYMENT_PROVIDERS: ReadonlySet<string> = new Set([
  "mercadopago",
  "cash_on_delivery",
  "stripe",
  "paypal",
  "bank_transfer",
]);

function asOrderStatus(value: unknown): OrderStatus {
  if (typeof value === "string" && ORDER_STATUSES.has(value)) {
    return value as OrderStatus;
  }
  return "pending_payment";
}

function asPaymentStatus(value: unknown): OrderPaymentStatus {
  if (typeof value === "string" && PAYMENT_STATUSES.has(value)) {
    return value as OrderPaymentStatus;
  }
  return "pending";
}

function asPaymentProvider(value: unknown): PaymentProviderId {
  if (typeof value === "string" && PAYMENT_PROVIDERS.has(value)) {
    return value as PaymentProviderId;
  }
  return "mercadopago";
}

function mapOrderItem(raw: unknown): OrderItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const productId = asString(data.productId);
  const productName = asString(data.productName);
  const quantity = asFiniteNumber(data.quantity, 0);

  if (!productId || !productName || quantity < 1) {
    return null;
  }

  const item: OrderItem = {
    productId,
    productName,
    image: asString(data.image),
    quantity,
    unitPrice: asFiniteNumber(data.unitPrice, 0),
  };

  if (typeof data.selectedSize === "string") {
    item.selectedSize = data.selectedSize;
  }
  if (
    data.selectedColor &&
    typeof data.selectedColor === "object" &&
    typeof (data.selectedColor as { name?: unknown }).name === "string" &&
    typeof (data.selectedColor as { hex?: unknown }).hex === "string"
  ) {
    item.selectedColor = {
      name: (data.selectedColor as { name: string }).name,
      hex: (data.selectedColor as { hex: string }).hex,
    };
  }
  if (typeof data.sku === "string") {
    item.sku = data.sku;
  }

  return item;
}

function mapShippingAddress(raw: unknown): OrderShippingAddress {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const address: OrderShippingAddress = {
    fullName: asString(data.fullName),
    line1: asString(data.line1),
    city: asString(data.city),
    state: asString(data.state),
    postalCode: asString(data.postalCode),
    country: asString(data.country),
  };

  if (typeof data.line2 === "string" && data.line2) {
    address.line2 = data.line2;
  }
  if (typeof data.phone === "string" && data.phone) {
    address.phone = data.phone;
  }

  return address;
}

function mapShippingMethod(raw: unknown): OrderShippingMethod {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    id: asString(data.id, "standard"),
    label: asString(data.label, "Standard Shipping"),
    cost: asFiniteNumber(data.cost, 0),
  };
}

function mapPayment(raw: unknown): OrderPayment {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const payment: OrderPayment = {
    provider: asPaymentProvider(data.provider),
    status: asPaymentStatus(data.status),
    amount: asFiniteNumber(data.amount, 0),
    currency: asString(data.currency, "ARS"),
  };

  const preferenceId =
    typeof data.preferenceId === "string" && data.preferenceId
      ? data.preferenceId
      : typeof data.externalId === "string" && data.externalId
        ? data.externalId
        : undefined;
  if (preferenceId) {
    payment.preferenceId = preferenceId;
    payment.externalId = preferenceId;
  }

  const paymentId =
    typeof data.paymentId === "string" && data.paymentId
      ? data.paymentId
      : typeof data.transactionId === "string" && data.transactionId
        ? data.transactionId
        : undefined;
  if (paymentId) {
    payment.paymentId = paymentId;
    payment.transactionId = paymentId;
  }

  if (typeof data.externalReference === "string" && data.externalReference) {
    payment.externalReference = data.externalReference;
  }

  const approvedAt =
    asOptionalTimestamp(data.approvedAt) ?? asOptionalTimestamp(data.paidAt);
  if (approvedAt) {
    payment.approvedAt = approvedAt;
    payment.paidAt = approvedAt;
  }

  return payment;
}

function mapTotals(raw: unknown): OrderTotals {
  const data =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return {
    subtotal: asFiniteNumber(data.subtotal, 0),
    shipping: asFiniteNumber(data.shipping, 0),
    discount: asFiniteNumber(data.discount, 0),
    tax: asFiniteNumber(data.tax, 0),
    total: asFiniteNumber(data.total, 0),
  };
}

/**
 * Maps a Firestore order document onto the typed `Order` domain model.
 * Tolerates partial / legacy documents so Admin and Checkout stay resilient.
 */
export function mapOrder(
  snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
): Order {
  const data = snapshot.data() ?? {};
  const now = Timestamp.now();

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems
    .map(mapOrderItem)
    .filter((item): item is OrderItem => item !== null);

  const order: Order = {
    id: snapshot.id,
    orderNumber: asString(data.orderNumber, snapshot.id),
    customerEmail: asString(data.customerEmail),
    customerName: asString(data.customerName),
    customerPhone: asString(data.customerPhone),
    status: asOrderStatus(data.status),
    items,
    shippingAddress: mapShippingAddress(data.shippingAddress),
    shippingMethod: mapShippingMethod(data.shippingMethod),
    payment: mapPayment(data.payment),
    totals: mapTotals(data.totals),
    currency: asString(data.currency, "ARS"),
    createdAt: asTimestamp(data.createdAt, now),
    updatedAt: asTimestamp(data.updatedAt, now),
  };

  if (typeof data.customerId === "string" && data.customerId) {
    order.customerId = data.customerId;
  }
  if (typeof data.notes === "string" && data.notes) {
    order.notes = data.notes;
  }

  const commitStatus = data.inventoryCommitStatus;
  if (
    commitStatus === "none" ||
    commitStatus === "committed" ||
    commitStatus === "restored" ||
    commitStatus === "shortfall"
  ) {
    order.inventoryCommitStatus = commitStatus;
  }

  return order;
}
