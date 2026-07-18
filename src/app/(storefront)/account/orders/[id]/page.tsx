import type { Metadata } from "next";

import { AccountOrderDetail } from "@/features/account/components";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Order detail",
};

type AccountOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Account order detail — `/account/orders/[id]` (RFC-018).
 * `id` is the Firestore document id; UI shows `orderNumber`.
 */
export default async function AccountOrderDetailPage({
  params,
}: AccountOrderDetailPageProps) {
  const { id } = await params;
  const settings = await getStoreSettings();

  return (
    <AccountOrderDetail
      orderId={id}
      locale={settings.locale}
      currency={settings.currency}
    />
  );
}
