import type { ReactNode } from "react";

/**
 * Admin navigation and shell types (RFC-011).
 */

export type AdminNavItem = {
  /** i18n key under admin.nav.* */
  labelKey: "dashboard" | "categories" | "products" | "orders" | "customers" | "settings";
  href: string;
  /** When true, item is visible but not navigable (future RFC placeholder). */
  disabled?: boolean;
};

export type AdminDataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

export type AdminPageMeta = {
  title: string;
  description?: string;
};
