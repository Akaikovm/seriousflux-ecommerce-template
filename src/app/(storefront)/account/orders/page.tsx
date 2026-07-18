import type { Metadata } from "next";

import { AccountOrderList } from "@/features/account/components";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Orders",
};

/**
 * Account orders list — `/account/orders` (RFC-018).
 */
export default async function AccountOrdersPage() {
  const settings = await getStoreSettings();

  return (
    <AccountOrderList locale={settings.locale} currency={settings.currency} />
  );
}
