import Link from "next/link";

import { createT, getDictionary, resolveLanguage } from "@/i18n";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";

/**
 * Admin order not found — `/admin/orders/[id]`.
 */
export default async function AdminOrderNotFound() {
  const settings = await getStoreSettings();
  const t = createT(getDictionary(resolveLanguage(settings.language)));

  return (
    <EmptyState
      title={t("admin.orders.notFoundTitle")}
      description={t("admin.orders.notFoundDescription")}
      action={
        <Link href="/admin/orders">
          <Button type="button">{t("admin.orders.backToOrders")}</Button>
        </Link>
      }
    />
  );
}
