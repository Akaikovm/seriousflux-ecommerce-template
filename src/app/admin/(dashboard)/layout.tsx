import type { ReactNode } from "react";

import { AdminDashboardShell } from "@/features/admin/components/AdminDashboardShell";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

/**
 * Protected admin dashboard layout (RFC-011).
 *
 * Loads store name for the sidebar; auth guard runs on the client.
 */
export default async function AdminProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const settings = await getStoreSettings();

  return (
    <AdminDashboardShell storeName={settings.storeName}>
      {children}
    </AdminDashboardShell>
  );
}
