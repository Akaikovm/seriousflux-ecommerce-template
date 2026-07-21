import Link from "next/link";

import { AdminEmptyState } from "@/features/admin/ui";
import { createT, getDictionary, resolveLanguage } from "@/i18n";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { Button } from "@/shared/ui/Button";

/**
 * Admin order not found — `/admin/orders/[id]`.
 */
export default async function AdminOrderNotFound() {
  const settings = await getStoreSettings();
  const t = createT(getDictionary(resolveLanguage(settings.language)));

  return (
    <AdminEmptyState
      title={t("admin.orders.notFoundTitle")}
      description={t("admin.orders.notFoundDescription")}
      action={
        <Link href="/admin/orders">
          <Button type="button" className="admin-btn-accent">
            {t("admin.orders.backToOrders")}
          </Button>
        </Link>
      }
    />
  );
}
