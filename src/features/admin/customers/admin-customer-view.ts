import type { PersistedRole, UserStatus } from "@/features/auth/types";
import type { CustomerProfile } from "@/features/customers/types";
import type { Order } from "@/features/orders/types";
import type { TranslateFn } from "@/i18n";

/**
 * Serializable customer row for Admin list/detail (no Firestore Timestamp).
 */
export type AdminCustomerView = {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string | null;
  role: PersistedRole;
  status: UserStatus;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
};

export type AdminCustomerOrderSummary = {
  orderCount: number;
  /** Sum of `totals.total` for orders with `payment.status === "paid"` (ADR-022). */
  totalSpent: number;
};

function toIso(timestamp: { toDate: () => Date }): string {
  return timestamp.toDate().toISOString();
}

/**
 * Maps a domain CustomerProfile onto serializable Admin props.
 */
export function toAdminCustomerView(
  customer: CustomerProfile,
): AdminCustomerView {
  const view: AdminCustomerView = {
    id: customer.id,
    email: customer.email,
    displayName: customer.displayName,
    role: customer.role,
    status: customer.status,
    createdAt: toIso(customer.createdAt),
    updatedAt: toIso(customer.updatedAt),
  };

  if (customer.phone) {
    view.phone = customer.phone;
  }
  if (customer.photoURL !== undefined) {
    view.photoURL = customer.photoURL;
  }

  return view;
}

/**
 * Derive order metrics for Customer Detail (paid-only spend).
 */
export function summarizeCustomerOrders(
  orders: Order[],
): AdminCustomerOrderSummary {
  let totalSpent = 0;
  for (const order of orders) {
    if (order.payment.status === "paid") {
      totalSpent += order.totals.total;
    }
  }

  return {
    orderCount: orders.length,
    totalSpent,
  };
}

export function getCustomerRoleLabel(
  role: PersistedRole,
  t?: TranslateFn,
): string {
  if (t) {
    switch (role) {
      case "admin":
        return t("admin.customers.role.admin");
      case "staff":
        return t("admin.customers.role.staff");
      case "customer":
      default:
        return t("admin.customers.role.customer");
    }
  }

  switch (role) {
    case "admin":
      return "Admin";
    case "staff":
      return "Staff";
    case "customer":
    default:
      return "Customer";
  }
}

export function getCustomerStatusLabel(
  status: UserStatus,
  t?: TranslateFn,
): string {
  if (t) {
    return status === "inactive"
      ? t("admin.customers.status.inactive")
      : t("admin.customers.status.active");
  }
  return status === "inactive" ? "Inactive" : "Active";
}
