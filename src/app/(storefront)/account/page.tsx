import type { Metadata } from "next";

import { AccountDashboard } from "@/features/account/components";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "My Account",
};

/**
 * Account dashboard — `/account` (RFC-018).
 */
export default async function AccountPage() {
  const settings = await getStoreSettings();

  return (
    <AccountDashboard locale={settings.locale} currency={settings.currency} />
  );
}
