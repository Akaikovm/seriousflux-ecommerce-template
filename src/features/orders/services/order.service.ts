import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
  type FirestoreError,
} from "firebase/firestore";

import { getFirestoreDb } from "@/firebase/firestore";
import { mapOrder } from "@/features/orders/lib/map-order";
import { generateOrderNumber } from "@/features/orders/lib/order-number";
import {
  canTransitionOrderStatus,
  normalizeOrderStatus,
} from "@/features/orders/lib/order-status";
import type {
  Order,
  OrderCreateInput,
  OrderItem,
  OrderPayment,
  OrderPaymentStatus,
  OrderPaymentUpdateInput,
  OrderShippingAddress,
  OrderShippingMethod,
  OrderTotals,
  OrderWritableStatus,
  PaymentProviderId,
} from "@/features/orders/types";

/** Firestore collection that holds purchase documents. */
export const ORDERS_COLLECTION = "orders";

/**
 * Domain error for order reads and writes.
 * Wraps Firebase failures so UI never depends on Firebase error shapes.
 */
export class OrderError extends Error {
  readonly code:
    | "unavailable"
    | "permission-denied"
    | "invalid-input"
    | "invalid-transition"
    | "not-found"
    | "unknown";

  constructor(
    message: string,
    code: OrderError["code"] = "unknown",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "OrderError";
    this.code = code;
  }
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Whether applying `next` would regress a stronger payment state.
 * Duplicate / out-of-order webhooks must not rewind paid or refunded.
 */
function isPaymentStatusRegression(
  current: OrderPaymentStatus,
  next: OrderPaymentStatus,
): boolean {
  if (current === next) {
    return false;
  }
  if (current === "refunded") {
    return true;
  }
  if (current === "paid") {
    return next === "pending" || next === "authorized" || next === "failed";
  }
  return false;
}

function toOrderError(error: unknown): OrderError {
  if (error instanceof OrderError) {
    return error;
  }

  const firestoreError = error as FirestoreError | undefined;
  const firebaseCode = firestoreError?.code;

  if (firebaseCode === "permission-denied") {
    return new OrderError(
      "You do not have permission to manage this order.",
      "permission-denied",
      { cause: error },
    );
  }

  if (firebaseCode === "not-found") {
    return new OrderError("Order not found.", "not-found", { cause: error });
  }

  if (
    firebaseCode === "unavailable" ||
    firebaseCode === "deadline-exceeded" ||
    firebaseCode === "resource-exhausted"
  ) {
    return new OrderError(
      "Orders are temporarily unavailable. Please try again.",
      "unavailable",
      { cause: error },
    );
  }

  if (firebaseCode === "failed-precondition") {
    return new OrderError(
      "Orders query failed a Firestore precondition (often a missing index). Check the browser console for details.",
      "unavailable",
      { cause: error },
    );
  }

  return new OrderError(
    "We could not complete this order operation. Please try again.",
    "unknown",
    { cause: error },
  );
}

function validateCreateInput(input: OrderCreateInput): void {
  if (!input.customerEmail.trim()) {
    throw new OrderError("Customer email is required.", "invalid-input");
  }
  if (!input.customerName.trim()) {
    throw new OrderError("Customer name is required.", "invalid-input");
  }
  if (!input.customerPhone.trim()) {
    throw new OrderError("Customer phone is required.", "invalid-input");
  }
  if (!input.currency.trim()) {
    throw new OrderError("Currency is required.", "invalid-input");
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderError("Order must include at least one item.", "invalid-input");
  }
  for (const item of input.items) {
    if (!item.productId || !item.productName || item.quantity < 1) {
      throw new OrderError("Order items are invalid.", "invalid-input");
    }
  }
}

function computeTotals(
  items: OrderItem[],
  shippingCost: number,
): OrderTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const shipping = asFiniteNumber(shippingCost, 0);
  const discount = 0;
  const tax = 0;
  const total = subtotal + shipping - discount + tax;

  return { subtotal, shipping, discount, tax, total };
}

function toFirestorePayload(
  input: OrderCreateInput,
  orderNumber: string,
  now: Timestamp,
): DocumentData {
  const shippingMethod: OrderShippingMethod = {
    id: input.shippingMethod.id,
    label: input.shippingMethod.label,
    cost: asFiniteNumber(input.shippingMethod.cost, 0),
  };

  const items: OrderItem[] = input.items.map((item) => {
    const line: OrderItem = {
      productId: item.productId,
      productName: item.productName,
      image: item.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    };
    if (item.selectedSize !== undefined) {
      line.selectedSize = item.selectedSize;
    }
    if (item.selectedColor !== undefined) {
      line.selectedColor = item.selectedColor;
    }
    if (item.sku !== undefined) {
      line.sku = item.sku;
    }
    return line;
  });

  const totals = computeTotals(items, shippingMethod.cost);
  const provider: PaymentProviderId = input.paymentProvider ?? "mercadopago";

  const payment: OrderPayment = {
    provider,
    status: "pending",
    amount: totals.total,
    currency: input.currency,
  };

  const shippingAddress: OrderShippingAddress = {
    fullName: input.shippingAddress.fullName,
    line1: input.shippingAddress.line1,
    city: input.shippingAddress.city,
    state: input.shippingAddress.state,
    postalCode: input.shippingAddress.postalCode,
    country: input.shippingAddress.country,
  };
  if (input.shippingAddress.line2) {
    shippingAddress.line2 = input.shippingAddress.line2;
  }
  if (input.shippingAddress.phone) {
    shippingAddress.phone = input.shippingAddress.phone;
  }

  const payload: DocumentData = {
    orderNumber,
    customerEmail: input.customerEmail.trim(),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    status: "pending_payment",
    items,
    shippingAddress,
    shippingMethod,
    payment,
    totals,
    currency: input.currency,
    createdAt: now,
    updatedAt: now,
  };

  if (input.customerId) {
    payload.customerId = input.customerId;
  }
  if (input.notes?.trim()) {
    payload.notes = input.notes.trim();
  }

  return payload;
}

function sortByCreatedAtDesc(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
  );
}

function assertWritableStatus(status: string): asserts status is OrderWritableStatus {
  const allowed: OrderWritableStatus[] = [
    "pending_payment",
    "paid",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ];
  if (!allowed.includes(status as OrderWritableStatus)) {
    throw new OrderError(
      "That fulfillment status cannot be written.",
      "invalid-input",
    );
  }
}

/**
 * Access to the `orders` collection.
 *
 * Framework-agnostic: no React, hooks, context, or UI.
 * Admin and Checkout share this service — never import Firebase from UI.
 */
export class OrderService {
  constructor(private readonly db: Firestore = getFirestoreDb()) {}

  /**
   * Creates an unpaid order from Checkout.
   *
   * Sets `status: "pending_payment"` and `payment.status: "pending"`.
   * Generates a customer-facing `orderNumber` (not the Firestore document id).
   *
   * @throws {OrderError} on validation or Firestore failures (never raw Firebase errors).
   */
  async create(input: OrderCreateInput): Promise<Order> {
    try {
      validateCreateInput(input);

      const now = Timestamp.now();
      const orderNumber = generateOrderNumber(now.toDate());
      const payload = toFirestorePayload(input, orderNumber, now);
      const ref = await addDoc(collection(this.db, ORDERS_COLLECTION), payload);

      const totals = payload.totals as OrderTotals;
      const payment = payload.payment as OrderPayment;
      const shippingMethod = payload.shippingMethod as OrderShippingMethod;
      const shippingAddress = payload.shippingAddress as OrderShippingAddress;
      const items = payload.items as OrderItem[];

      const order: Order = {
        id: ref.id,
        orderNumber,
        customerEmail: input.customerEmail.trim(),
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        status: "pending_payment",
        items,
        shippingAddress,
        shippingMethod,
        payment,
        totals,
        currency: input.currency,
        createdAt: now,
        updatedAt: now,
      };

      if (input.customerId) {
        order.customerId = input.customerId;
      }
      if (input.notes?.trim()) {
        order.notes = input.notes.trim();
      }

      return order;
    } catch (error) {
      throw toOrderError(error);
    }
  }

  /**
   * All orders newest-first (admin list, RFC-014).
   *
   * @throws {OrderError} on Firestore failures (never raw Firebase errors).
   */
  async listAll(): Promise<Order[]> {
    try {
      const snapshot = await getDocs(collection(this.db, ORDERS_COLLECTION));
      return sortByCreatedAtDesc(snapshot.docs.map(mapOrder));
    } catch (error) {
      throw toOrderError(error);
    }
  }

  /**
   * Find an order by document id. Returns `null` when missing.
   *
   * @throws {OrderError} on Firestore failures (never raw Firebase errors).
   */
  async getById(id: string): Promise<Order | null> {
    try {
      const trimmed = id.trim();
      if (!trimmed) {
        return null;
      }

      const snapshot = await getDoc(doc(this.db, ORDERS_COLLECTION, trimmed));
      if (!snapshot.exists()) {
        return null;
      }

      return mapOrder(snapshot);
    } catch (error) {
      throw toOrderError(error);
    }
  }

  /**
   * Orders for a customer, newest first (RFC-018 Account).
   *
   * Uses equality filter only + client sort so the kit works without a
   * composite index. Add `customerId` ASC + `createdAt` DESC later for scale.
   *
   * @throws {OrderError} on Firestore failures (never raw Firebase errors).
   */
  async listByCustomerId(customerId: string): Promise<Order[]> {
    try {
      const trimmed = customerId.trim();
      if (!trimmed) {
        return [];
      }

      const q = query(
        collection(this.db, ORDERS_COLLECTION),
        where("customerId", "==", trimmed),
      );
      const snapshot = await getDocs(q);
      return sortByCreatedAtDesc(snapshot.docs.map(mapOrder));
    } catch (error) {
      throw toOrderError(error);
    }
  }

  /**
   * Customer-scoped order read with ownership verification (RFC-018).
   * Returns `null` when missing or when `order.customerId !== customerId`
   * (same response either way — no existence leak).
   *
   * @throws {OrderError} on Firestore failures (never raw Firebase errors).
   */
  async getForCustomer(
    orderId: string,
    customerId: string,
  ): Promise<Order | null> {
    try {
      const order = await this.getById(orderId);
      if (!order) {
        return null;
      }

      const ownerId = customerId.trim();
      if (!ownerId || !order.customerId || order.customerId !== ownerId) {
        return null;
      }

      return order;
    } catch (error) {
      throw toOrderError(error);
    }
  }

  /**
   * Updates fulfillment status with validated transitions (RFC-014).
   *
   * Never writes legacy aliases (`delivered`, `pending`, order-level `refunded`).
   * Setting status to `paid` also marks `payment.status` paid when still unpaid
   * (keeps Admin manual flow consistent before Mercado Pago).
   *
   * Cancellation does not change `payment.status` (refunds are separate).
   *
   * @throws {OrderError} on validation, transition, or Firestore failures.
   */
  async updateStatus(id: string, status: OrderWritableStatus): Promise<Order> {
    try {
      assertWritableStatus(status);

      const current = await this.getById(id);
      if (!current) {
        throw new OrderError("Order not found.", "not-found");
      }

      if (!canTransitionOrderStatus(current.status, status)) {
        throw new OrderError(
          "That status change is not allowed for this order.",
          "invalid-transition",
        );
      }

      const now = Timestamp.now();
      const patch: DocumentData = {
        status,
        updatedAt: now,
      };

      if (
        status === "paid" &&
        current.payment.status !== "paid" &&
        current.payment.status !== "refunded"
      ) {
        patch["payment.status"] = "paid";
        if (!current.payment.paidAt) {
          patch["payment.paidAt"] = now;
        }
      }

      await updateDoc(doc(this.db, ORDERS_COLLECTION, id), patch);
      const updated = await this.getById(id);
      if (!updated) {
        throw new OrderError("Order not found.", "not-found");
      }
      return updated;
    } catch (error) {
      throw toOrderError(error);
    }
  }

  /**
   * Updates payment status and optional provider metadata (Admin / webhooks).
   *
   * Sync rule: when `payment.status` becomes `"paid"`, order `status` becomes
   * `"paid"` if it is still awaiting payment (`pending_payment` / legacy `pending`).
   * Does not rewind fulfillment past `paid`.
   *
   * Idempotent: identical `paymentId` + `status` (and unchanged metadata) is a no-op.
   * Does not regress stronger payment states (e.g. paid → pending from late webhooks).
   *
   * @throws {OrderError} on validation or Firestore failures.
   */
  async updatePayment(
    id: string,
    input: OrderPaymentUpdateInput,
  ): Promise<Order> {
    try {
      const allowed: OrderPaymentStatus[] = [
        "pending",
        "authorized",
        "paid",
        "failed",
        "refunded",
      ];
      if (!allowed.includes(input.status)) {
        throw new OrderError("Invalid payment status.", "invalid-input");
      }

      const current = await this.getById(id);
      if (!current) {
        throw new OrderError("Order not found.", "not-found");
      }

      const nextPaymentId = input.paymentId?.trim() || undefined;
      const nextPreferenceId = input.preferenceId?.trim() || undefined;
      const nextExternalReference = input.externalReference?.trim() || undefined;
      const currentPaymentId =
        current.payment.paymentId ?? current.payment.transactionId;
      const currentPreferenceId =
        current.payment.preferenceId ?? current.payment.externalId;

      const samePaymentId =
        !nextPaymentId || nextPaymentId === currentPaymentId;
      const sameStatus = input.status === current.payment.status;
      const samePreference =
        !nextPreferenceId || nextPreferenceId === currentPreferenceId;
      const sameReference =
        !nextExternalReference ||
        nextExternalReference === current.payment.externalReference;
      const sameProvider =
        !input.provider || input.provider === current.payment.provider;

      if (
        samePaymentId &&
        sameStatus &&
        samePreference &&
        sameReference &&
        sameProvider
      ) {
        return current;
      }

      if (isPaymentStatusRegression(current.payment.status, input.status)) {
        return current;
      }

      const now = Timestamp.now();
      const patch: DocumentData = {
        "payment.status": input.status,
        updatedAt: now,
      };

      if (input.provider) {
        patch["payment.provider"] = input.provider;
      }

      if (nextPreferenceId) {
        patch["payment.preferenceId"] = nextPreferenceId;
        patch["payment.externalId"] = nextPreferenceId;
      }

      if (nextPaymentId) {
        patch["payment.paymentId"] = nextPaymentId;
        patch["payment.transactionId"] = nextPaymentId;
      }

      if (nextExternalReference) {
        patch["payment.externalReference"] = nextExternalReference;
      }

      if (input.status === "paid") {
        const approvedAt = input.approvedAt
          ? Timestamp.fromDate(input.approvedAt)
          : current.payment.approvedAt ??
            current.payment.paidAt ??
            now;

        if (!current.payment.paidAt && !current.payment.approvedAt) {
          patch["payment.paidAt"] = approvedAt;
          patch["payment.approvedAt"] = approvedAt;
        } else if (input.approvedAt && !current.payment.approvedAt) {
          patch["payment.approvedAt"] = approvedAt;
          if (!current.payment.paidAt) {
            patch["payment.paidAt"] = approvedAt;
          }
        }

        const canonical = normalizeOrderStatus(current.status);
        if (canonical === "pending_payment") {
          patch.status = "paid";
        }
      }

      await updateDoc(doc(this.db, ORDERS_COLLECTION, id), patch);
      const updated = await this.getById(id);
      if (!updated) {
        throw new OrderError("Order not found.", "not-found");
      }
      return updated;
    } catch (error) {
      throw toOrderError(error);
    }
  }

  /**
   * Updates payment status only (Admin ops).
   * Delegates to {@link updatePayment} so webhook and Admin share one write path.
   *
   * @throws {OrderError} on validation or Firestore failures.
   */
  async updatePaymentStatus(
    id: string,
    paymentStatus: OrderPaymentStatus,
  ): Promise<Order> {
    return this.updatePayment(id, { status: paymentStatus });
  }

  /**
   * Updates internal admin notes (RFC-014).
   * Empty string clears the field.
   *
   * @throws {OrderError} on Firestore failures.
   */
  async updateNotes(id: string, notes: string): Promise<Order> {
    try {
      const current = await this.getById(id);
      if (!current) {
        throw new OrderError("Order not found.", "not-found");
      }

      const trimmed = notes.trim();
      const now = Timestamp.now();
      const patch: DocumentData = {
        updatedAt: now,
        notes: trimmed.length > 0 ? trimmed : null,
      };

      await updateDoc(doc(this.db, ORDERS_COLLECTION, id), patch);
      const updated = await this.getById(id);
      if (!updated) {
        throw new OrderError("Order not found.", "not-found");
      }
      return updated;
    } catch (error) {
      throw toOrderError(error);
    }
  }
}
