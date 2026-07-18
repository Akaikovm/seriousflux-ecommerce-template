"use client";

import type { ReactNode } from "react";

import { AdminLayout } from "@/features/admin/components/AdminLayout";
import { RequireRole } from "@/features/auth/guards";
import { ToastProvider } from "@/shared/ui/Toast";

import "@/features/admin/styles/admin.css";

type AdminDashboardShellProps = {
  children: ReactNode;
  storeName: string;
};

/**
 * Client wrapper: role gate + admin shell (RFC-017).
 *
 * Shell (sidebar/header) renders immediately; RequireRole only gates page
 * content so auth resolution does not blank the whole chrome.
 * Requires role=admin and status=active — authentication alone is not enough.
 */
export function AdminDashboardShell({
  children,
  storeName,
}: AdminDashboardShellProps) {
  return (
    <ToastProvider>
      <AdminLayout storeName={storeName}>
        <RequireRole roles={["admin"]} redirectTo="/admin/login">
          {children}
        </RequireRole>
      </AdminLayout>
    </ToastProvider>
  );
}
