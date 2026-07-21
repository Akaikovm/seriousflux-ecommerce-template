import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/firebase/admin";
import { mapOrderFromData } from "@/features/orders/lib/map-order";
import { normalizeOrderStatus } from "@/features/orders/lib/order-status";
import {
  OrderError,
  ORDERS_COLLECTION,
} from "@/features/orders/services/order.service";
import type {
  InventoryCommitStatus,
  Order,
  OrderPaymentStatus,
  OrderPaymentUpdateInput,
} from "@/features/orders/types";

/**
 * Whether applying `next` would regress a stronger payment state.
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

function sortByCreatedAtDesc(orders: Order[]): Order[] {
  return [...orders].sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
  );
}

/**
 * Privileged order access via Firebase Admin SDK (GAP-004).
 * Bypasses Security Rules — server routes and Admin SSR only.
 */
export class AdminOrderService {
  /**
   * @throws {OrderError} on Firestore failures.
   */
  async getById(id: string): Promise<Order | null> {
    const trimmed = id.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const snap = await getAdminDb().collection(ORDERS_COLLECTION).doc(trimmed).get();
      if (!snap.exists) {
        return null;
      }
      return mapOrderFromData(snap.id, snap.data() ?? {});
    } catch (error) {
      throw new OrderError("Failed to load order.", "unknown", { cause: error });
    }
  }

  async listAll(): Promise<Order[]> {
    try {
      const snap = await getAdminDb().collection(ORDERS_COLLECTION).get();
      return sortByCreatedAtDesc(
        snap.docs.map((doc) => mapOrderFromData(doc.id, doc.data())),
      );
    } catch (error) {
      throw new OrderError("Failed to list orders.", "unknown", { cause: error });
    }
  }

  async listByCustomerId(customerId: string): Promise<Order[]> {
    const ownerId = customerId.trim();
    if (!ownerId) {
      return [];
    }

    try {
      const snap = await getAdminDb()
        .collection(ORDERS_COLLECTION)
        .where("customerId", "==", ownerId)
        .get();
      return sortByCreatedAtDesc(
        snap.docs.map((doc) => mapOrderFromData(doc.id, doc.data())),
      );
    } catch (error) {
      throw new OrderError("Failed to list customer orders.", "unknown", {
        cause: error,
      });
    }
  }

  /**
   * Same semantics as {@link OrderService.updatePayment} — Admin SDK write path.
   */
  async updatePayment(
    id: string,
    input: OrderPaymentUpdateInput,
  ): Promise<Order> {
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

    const samePaymentId = !nextPaymentId || nextPaymentId === currentPaymentId;
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
    const patch: Record<string, unknown> = {
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
        : current.payment.approvedAt
          ? Timestamp.fromMillis(current.payment.approvedAt.toMillis())
          : current.payment.paidAt
            ? Timestamp.fromMillis(current.payment.paidAt.toMillis())
            : now;

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

    try {
      await getAdminDb().collection(ORDERS_COLLECTION).doc(id).update(patch);
      const updated = await this.getById(id);
      if (!updated) {
        throw new OrderError("Order not found.", "not-found");
      }
      return updated;
    } catch (error) {
      if (error instanceof OrderError) {
        throw error;
      }
      throw new OrderError("Failed to update payment.", "unknown", {
        cause: error,
      });
    }
  }

  async updateNotes(id: string, notes: string): Promise<Order> {
    const current = await this.getById(id);
    if (!current) {
      throw new OrderError("Order not found.", "not-found");
    }

    const trimmed = notes.trim();
    try {
      await getAdminDb()
        .collection(ORDERS_COLLECTION)
        .doc(id)
        .update({
          updatedAt: Timestamp.now(),
          notes: trimmed.length > 0 ? trimmed : FieldValue.delete(),
        });
      const updated = await this.getById(id);
      if (!updated) {
        throw new OrderError("Order not found.", "not-found");
      }
      return updated;
    } catch (error) {
      if (error instanceof OrderError) {
        throw error;
      }
      throw new OrderError("Failed to update notes.", "unknown", {
        cause: error,
      });
    }
  }

  async updateInventoryCommitStatus(
    id: string,
    status: InventoryCommitStatus,
  ): Promise<Order> {
    const current = await this.getById(id);
    if (!current) {
      throw new OrderError("Order not found.", "not-found");
    }

    try {
      await getAdminDb()
        .collection(ORDERS_COLLECTION)
        .doc(id)
        .update({
          inventoryCommitStatus: status,
          updatedAt: Timestamp.now(),
        });
      const updated = await this.getById(id);
      if (!updated) {
        throw new OrderError("Order not found.", "not-found");
      }
      return updated;
    } catch (error) {
      if (error instanceof OrderError) {
        throw error;
      }
      throw new OrderError("Failed to update inventory commit status.", "unknown", {
        cause: error,
      });
    }
  }
}
