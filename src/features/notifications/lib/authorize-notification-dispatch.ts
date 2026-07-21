import { IdentityBootstrapService } from "@/features/auth/services/identity-bootstrap.service";
import type { NotificationDispatchInput } from "@/features/notifications/types";
import { verifyFirebaseIdToken } from "@/features/notifications/lib/verify-firebase-id-token";
import { OrderService } from "@/features/orders/services";

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
 * Policy:
 * - `account.welcome` → valid ID token; email (and optional customerId) must match
 * - Admin order/payment events → valid ID token + active admin role
 * - `order.created` → signed-in buyer match, or guest with a recent order doc
 *
 * Trusted server modules (Mercado Pago webhook) call `dispatchNotificationSafely`
 * directly and skip this gate.
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
    order = await new OrderService().getById(orderId);
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

  // Guest checkout: allow only while the order is freshly created.
  const createdAtMs = order.createdAt.toMillis();
  return Date.now() - createdAtMs <= GUEST_ORDER_CREATED_MAX_AGE_MS;
}
