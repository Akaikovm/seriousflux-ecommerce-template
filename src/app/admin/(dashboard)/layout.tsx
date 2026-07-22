import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminDashboardShell } from "@/features/admin/components/AdminDashboardShell";
import { requireAdminSession } from "@/features/auth/lib/admin-session";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

/**
 * Admin reads Firestore via the client SDK, which Next does not treat as a
 * dynamic data source. Without this, list pages (orders, products, …) can be
 * statically cached and show stale counts after new documents are created.
 */
export const dynamic = "force-dynamic";

/**
 * Protected admin dashboard layout (RFC-011 / GAP-002).
 *
 * Server gate: Firebase session cookie + active admin. Client RequireRole
 * remains for UX; security is this check + Firestore rules.
 */
export default async function AdminProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const settings = await getStoreSettings();

  return (
    <AdminDashboardShell storeName={settings.storeName}>
      {children}
    </AdminDashboardShell>
  );
}
