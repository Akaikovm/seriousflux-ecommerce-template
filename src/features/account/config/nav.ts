export type AccountNavItem = {
  id: string;
  href: string;
  /** When false, reserved for a future RFC and not rendered. */
  enabled: boolean;
};

/**
 * Account sidebar navigation (RFC-018).
 * Labels resolved via i18n `account.nav.*` in AccountLayout.
 * Wishlist / Addresses / Notifications stay disabled until implemented.
 */
export const ACCOUNT_NAV_ITEMS: readonly AccountNavItem[] = [
  { id: "dashboard", href: "/account", enabled: true },
  {
    id: "orders",
    href: "/account/orders",
    enabled: true,
  },
  {
    id: "profile",
    href: "/account/profile",
    enabled: true,
  },
  {
    id: "wishlist",
    href: "/account/wishlist",
    enabled: false,
  },
  {
    id: "addresses",
    href: "/account/addresses",
    enabled: false,
  },
  {
    id: "notifications",
    href: "/account/notifications",
    enabled: false,
  },
] as const;

export function getEnabledAccountNavItems(): AccountNavItem[] {
  return ACCOUNT_NAV_ITEMS.filter((item) => item.enabled);
}
