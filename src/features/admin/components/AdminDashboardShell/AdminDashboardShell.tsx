"use client";

import type { ReactNode } from "react";

import { AdminLayout } from "@/features/admin/components/AdminLayout";
import { RequireAuth } from "@/features/auth/components";
import { ToastProvider } from "@/shared/ui/Toast";

import "@/features/admin/styles/admin.css";
type AdminDashboardShellProps = {
  children: ReactNode;
  storeName: string;
};

/**
 * Client wrapper: auth gate + admin shell (RFC-011).
 *
 * Shell (sidebar/header) renders immediately; RequireAuth only gates page
 * content so auth resolution does not blank the whole chrome.
 */
export function AdminDashboardShell({
  children,
  storeName,
}: AdminDashboardShellProps) {
  return (
    <ToastProvider>
      <AdminLayout storeName={storeName}>
        <RequireAuth>{children}</RequireAuth>
      </AdminLayout>
    </ToastProvider>
  );
}
