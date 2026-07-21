"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { AdminHeader } from "@/features/admin/components/AdminHeader";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { ADMIN_NAV_ITEMS } from "@/features/admin/config/nav";
import { useT, type TranslateFn } from "@/i18n";

import "@/features/admin/styles/tokens.css";
import "@/features/admin/styles/admin.css";
import "@/features/admin/styles/admin-ui.css";
import "@/features/admin/styles/settings.css";

type AdminLayoutProps = {
  storeName: string;
  children: ReactNode;
};

function resolvePageTitle(pathname: string, t: TranslateFn): string {
  const match = ADMIN_NAV_ITEMS.find((item) => {
    if (item.href === "/admin") {
      return pathname === "/admin";
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });

  return match
    ? t(`admin.nav.${match.labelKey}`)
    : t("admin.common.adminLabel");
}

/**
 * Professional admin dashboard shell (RFC-011).
 *
 * Desktop: persistent sidebar + header + content.
 * Mobile: off-canvas sidebar with accessible controls.
 */
export function AdminLayout({ storeName, children }: AdminLayoutProps) {
  const t = useT();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = resolvePageTitle(pathname, t);

  return (
    <div className="admin-shell flex">
      <AdminSidebar
        storeName={storeName}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="admin-content flex min-h-screen flex-col">
        <AdminHeader
          title={title}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="admin-main flex-1 p-3 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
