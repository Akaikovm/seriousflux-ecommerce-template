import "server-only";

import { IdentityBootstrapService } from "@/features/auth/services/identity-bootstrap.service";
import { adminGetCustomerById, adminGetOrderById } from "@/features/admin/lib/admin-server-data";
import type { NotificationDispatchInput } from "@/features/notifications/types";
import { verifyFirebaseIdToken } from "@/features/notifications/lib/verify-firebase-id-token";
import { isFirebaseAdminConfigured } from "@/firebase/admin";

/** Guest `order.created` may fire only shortly after the order exists. */
const GUEST_ORDER_CREATED_MAX_AGE_MS = 15 * 60 * 1000;

const ADMIN_EVENTS = new Set<NotificationDispatchInput["event"]>([
  "order.shipped",
  "order.cancelled",
  "payment.approved",
  "payment.failed",
]);

/**
 * Authorizes browser-originated notification dispatch (server action path).
 *
 * Customer/order reads use Admin SDK when configured (GAP-004); otherwise
 * fall back to the client SDK identity helper (open-rules local DX).
 */
export async function authorizeNotificationDispatch(
  input: NotificationDispatchInput,
  idToken: string | null | undefined,
): Promise<boolean> {
  const user = await verifyFirebaseIdToken(idToken);

  if (input.event === "account.welcome") {
    if (!user?.email) {
      return false;
    }

    if (user.email !== input.email.trim().toLowerCase()) {
      return false;
    }

    if (input.customerId && input.customerId !== user.uid) {
      return false;
    }

    return true;
  }

  if (ADMIN_EVENTS.has(input.event)) {
    if (!user) {
      return false;
    }

    return isActiveAdmin(user.uid);
  }

  if (input.event === "order.created") {
    return authorizeOrderCreated(input.orderId, user);
  }

  return false;
}

async function isActiveAdmin(uid: string): Promise<boolean> {
  try {
    if (isFirebaseAdminConfigured()) {
      const identity = await adminGetCustomerById(uid);
      return identity?.role === "admin" && identity.status === "active";
    }

    const identity = await new IdentityBootstrapService().getById(uid);
    return identity?.role === "admin" && identity.status === "active";
  } catch {
    return false;
  }
}

async function authorizeOrderCreated(
  orderId: string,
  user: { uid: string; email: string | null } | null,
): Promise<boolean> {
  let order;
  try {
    if (isFirebaseAdminConfigured()) {
      order = await adminGetOrderById(orderId);
    } else {
      const { OrderService } = await import("@/features/orders/services");
      order = await new OrderService().getById(orderId);
    }
  } catch {
    return false;
  }

  if (!order) {
    return false;
  }

  if (user) {
    if (order.customerId && order.customerId === user.uid) {
      return true;
    }

    if (
      user.email &&
      order.customerEmail.trim().toLowerCase() === user.email
    ) {
      return true;
    }

    return false;
  }

  const createdAtMs = order.createdAt.toMillis();
  return Date.now() - createdAtMs <= GUEST_ORDER_CREATED_MAX_AGE_MS;
}
