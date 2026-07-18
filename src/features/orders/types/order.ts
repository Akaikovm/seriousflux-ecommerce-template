import type { Timestamp } from "firebase/firestore";

import type { ProductColor, ProductSize } from "@/features/products/types/product";

/**
 * Supported payment providers on orders (RFC-016.5).
 * Implemented today: Mercado Pago, Cash on Delivery.
 * Reserved for later: Stripe, PayPal, Bank Transfer.
 */
export type PaymentProviderId =
  | "mercadopago"
  | "cash_on_delivery"
  | "stripe"
  | "paypal"
  | "bank_transfer";

/**
 * Lifecycle status of an order (fulfillment + payment gate).
 *
 * Canonical write path (RFC-014):
 * `pending_payment` → `paid` → `processing` → `shipped` → `completed`
 * Cancellation allowed from `pending_payment` and `paid` only.
 *
 * Legacy read-only values:
 * - `pending` — treat as `pending_payment`
 * - `delivered` — treat as `completed` (never write again)
 * - `refunded` — legacy order-level refund; refunds live on `payment.status`
 */
export type OrderStatus =
  | "pending_payment"
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "delivered"
  | "cancelled"
  | "refunded";

/**
 * Statuses Admin / services may write. Never includes legacy aliases.
 */
export type OrderWritableStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

/**
 * Payment status tracked independently from fulfillment status.
 */
export type OrderPaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded";

/**
 * Snapshot of a line item at the moment of purchase.
 *
 * Product fields are denormalized so historical orders remain accurate
 * even if the catalog product is later edited or deleted.
 * `productId` is retained for stock deduction and soft catalog links.
 */
export interface OrderItem {
  /** Reference to `products/{productId}` at purchase time. */
  productId: string;

  /** Product name snapshot. */
  productName: string;

  /** Primary image snapshot for order history UI. */
  image: string;

  quantity: number;

  /** Unit price snapshot in store currency. */
  unitPrice: number;

  /**
   * Selected size at checkout (dynamic string; see `ProductSize`).
   * Optional until product variants ship — catalog v1 has no sizes.
   */
  selectedSize?: ProductSize;

  /**
   * Selected color at checkout.
   * Optional until product variants ship — catalog v1 has no colors.
   */
  selectedColor?: ProductColor;

  /** SKU snapshot when available. */
  sku?: string;
}

/**
 * Shipping address captured on the order (immutable after placement).
 */
export interface OrderShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

/**
 * Shipping method snapshot chosen at checkout.
 * Cost is copied into `totals.shipping` as well for money math.
 */
export interface OrderShippingMethod {
  /** Stable method id (e.g. `"standard"`). */
  id: string;

  /** Customer-facing label at purchase time. */
  label: string;

  /** Shipping cost in store currency at purchase time. */
  cost: number;
}

/**
 * Payment metadata for the active provider abstraction.
 * Provider-specific ids live here so Stripe/PayPal can be added later.
 *
 * RFC-016 field names (`preferenceId`, `paymentId`, `externalReference`,
 * `approvedAt`) are canonical for Mercado Pago. Legacy aliases
 * (`externalId`, `transactionId`, `paidAt`) are kept in sync for Admin UI.
 */
export interface OrderPayment {
  provider: PaymentProviderId;

  status: OrderPaymentStatus;

  /** Provider checkout / preference / session id (alias of `preferenceId`). */
  externalId?: string;

  /** Provider payment / charge id after capture (alias of `paymentId`). */
  transactionId?: string;

  /** Mercado Pago preference id (Checkout Pro). */
  preferenceId?: string;

  /** Mercado Pago payment id after the buyer pays. */
  paymentId?: string;

  /** Integrator reference sent to the provider (order document id). */
  externalReference?: string;

  /** Amount charged in store currency. */
  amount: number;

  /** ISO 4217 currency code snapshot. */
  currency: string;

  /** When payment was approved / captured (alias of `approvedAt`). */
  paidAt?: Timestamp;

  /** When the provider reported payment approval. */
  approvedAt?: Timestamp;
}

/**
 * Partial payment update used by providers / webhooks (RFC-016).
 * Only provided fields are written; omitted fields are left unchanged.
 */
export type OrderPaymentUpdateInput = {
  status: OrderPaymentStatus;
  provider?: PaymentProviderId;
  preferenceId?: string;
  paymentId?: string;
  externalReference?: string;
  /** When set, written to both `approvedAt` and `paidAt`. */
  approvedAt?: Date;
};

/**
 * Monetary totals for an order.
 */
export interface OrderTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
}

/**
 * Input for creating an unpaid order at Checkout (RFC-013).
 * Timestamps, document id, and `orderNumber` are owned by OrderService.
 */
export type OrderCreateInput = {
  /** Guest checkout omits; authenticated checkout sets Auth uid (RFC-017). */
  customerId?: string;

  customerEmail: string;
  customerName: string;
  customerPhone: string;

  items: OrderItem[];
  shippingAddress: OrderShippingAddress;
  shippingMethod: OrderShippingMethod;

  /** Intended provider; payment is not captured in RFC-013. */
  paymentProvider?: PaymentProviderId;

  currency: string;
  notes?: string;
};

/**
 * Order document.
 *
 * Collection: `orders`
 *
 * Orders are the source of truth for purchased items, payment state and
 * fulfillment. Line items are snapshots; stock deduction uses `productId`
 * against product-level inventory (not per size/color).
 */
export interface Order {
  /** Firestore document id (internal). Prefer `orderNumber` for customer UX. */
  id: string;

  /**
   * Human-friendly order reference for receipts, support, and confirmation UI.
   * Format owned by OrderService (e.g. `SF-20260717-A3K9`).
   * Never treat Firestore `id` as the customer-facing number.
   */
  orderNumber: string;

  /**
   * Reference to `customers/{customerId}`.
   * Optional for guest checkout; set to Auth uid when the buyer is signed in.
   */
  customerId?: string;

  /** Customer email snapshot for receipts and admin search. */
  customerEmail: string;

  /** Customer display name snapshot. */
  customerName: string;

  /** Customer phone snapshot from checkout. */
  customerPhone: string;

  status: OrderStatus;

  items: OrderItem[];

  shippingAddress: OrderShippingAddress;

  shippingMethod: OrderShippingMethod;

  payment: OrderPayment;

  totals: OrderTotals;

  /** ISO 4217 currency code snapshot from settings at checkout. */
  currency: string;

  /**
   * Internal admin notes (RFC-014).
   * Not shown on storefront confirmation; separate from customer-facing copy.
   */
  notes?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
