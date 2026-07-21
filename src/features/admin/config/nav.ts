import type { AdminNavItem } from "@/features/admin/types";

/**
 * Primary admin sidebar navigation (RFC-011 / RFC-014).
 * Labels resolved via i18n `admin.nav.*` in AdminSidebar.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { labelKey: "dashboard", href: "/admin" },
  { labelKey: "categories", href: "/admin/categories" },
  { labelKey: "products", href: "/admin/products" },
  { labelKey: "orders", href: "/admin/orders" },
  { labelKey: "customers", href: "/admin/customers" },
  { labelKey: "settings", href: "/admin/settings" },
];
