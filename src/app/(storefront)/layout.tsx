import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { getBrandStyle } from "@/features/settings/lib/brand-style";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { StorefrontToastProvider } from "@/features/storefront/components/StorefrontToastProvider";

import "@/features/storefront/styles/storefront.css";

/**
 * Storefront route-group layout (RFC-011).
 *
 * Isolates Navbar / Footer / brand CSS from `/admin` so the admin dashboard
 * can use a neutral shell without storefront chrome.
 * ToastProvider is shared with Admin (RFC-013 Checkout feedback).
 */
export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const settings = await getStoreSettings();

  return (
    <div className="flex min-h-full flex-1 flex-col" style={getBrandStyle(settings)}>
      <StorefrontToastProvider>
        <AppLayout settings={settings}>{children}</AppLayout>
      </StorefrontToastProvider>
    </div>
  );
}
