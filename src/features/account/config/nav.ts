export type AccountNavItem = {
  id: string;
  label: string;
  href: string;
  /** When false, reserved for a future RFC and not rendered. */
  enabled: boolean;
};

/**
 * Account sidebar navigation (RFC-018).
 * Wishlist / Addresses / Notifications stay disabled until implemented.
 */
export const ACCOUNT_NAV_ITEMS: readonly AccountNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/account", enabled: true },
  {
    id: "orders",
    label: "Orders",
    href: "/account/orders",
    enabled: true,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/account/profile",
    enabled: true,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    href: "/account/wishlist",
    enabled: false,
  },
  {
    id: "addresses",
    label: "Addresses",
    href: "/account/addresses",
    enabled: false,
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/account/notifications",
    enabled: false,
  },
] as const;

export function getEnabledAccountNavItems(): AccountNavItem[] {
  return ACCOUNT_NAV_ITEMS.filter((item) => item.enabled);
}
