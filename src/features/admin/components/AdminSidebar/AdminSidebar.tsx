"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ADMIN_NAV_ITEMS } from "@/features/admin/config/nav";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/products": Package,
  "/admin/categories": FolderTree,
  "/admin/settings": Settings,
  "/admin/orders": ShoppingBag,
  "/admin/customers": Users,
};

type AdminSidebarProps = {
  storeName: string;
  open: boolean;
  onClose: () => void;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Admin sidebar navigation — desktop persistent, mobile off-canvas (RFC-011).
 */
export function AdminSidebar({ storeName, open, onClose }: AdminSidebarProps) {
  const t = useT();
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <button
          type="button"
          className="admin-sidebar-backdrop lg:hidden"
          aria-label={t("admin.common.closeNav")}
          onClick={onClose}
        />
      ) : null}

      <aside
        className="admin-sidebar flex h-full flex-col"
        data-open={open ? "true" : "false"}
        aria-label={t("admin.common.adminNav")}
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--admin-border)] px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--admin-fg)]">
              {storeName || t("admin.common.storeAdmin")}
            </p>
            <p className="text-xs text-[var(--admin-fg-muted)]">
              {t("admin.common.adminLabel")}
            </p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-md p-2 text-[var(--admin-fg-muted)] hover:bg-[var(--admin-accent-soft)] hover:text-[var(--admin-fg)] lg:hidden"
            aria-label={t("admin.common.closeNav")}
            onClick={onClose}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 p-3"
          aria-label={t("admin.common.primaryNav")}
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
            const active = isActivePath(pathname, item.href);
            const label = t(`admin.nav.${item.labelKey}`);

            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  className={cn("admin-nav-link")}
                  data-disabled="true"
                  aria-disabled="true"
                  title={t("admin.common.comingSoon")}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span>{label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide">
                    {t("admin.common.soon")}
                  </span>
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="admin-nav-link"
                data-active={active ? "true" : "false"}
                aria-current={active ? "page" : undefined}
                onClick={onClose}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
