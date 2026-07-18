import type { AdminNavItem } from "@/features/admin/types";

/**
 * Primary admin sidebar navigation (RFC-011 / RFC-014).
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Settings", href: "/admin/settings" },
];

