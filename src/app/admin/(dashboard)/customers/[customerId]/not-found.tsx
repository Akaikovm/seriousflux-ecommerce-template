import Link from "next/link";

import { AdminEmptyState } from "@/features/admin/ui";
import { createT, getDictionary, resolveLanguage } from "@/i18n";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { Button } from "@/shared/ui/Button";

/**
 * Admin customer not found — `/admin/customers/[customerId]`.
 */
export default async function AdminCustomerNotFound() {
  const settings = await getStoreSettings();
  const t = createT(getDictionary(resolveLanguage(settings.language)));

  return (
    <AdminEmptyState
      title={t("admin.customers.notFoundTitle")}
      description={t("admin.customers.notFoundDescription")}
      action={
        <Link href="/admin/customers">
          <Button type="button" className="admin-btn-accent">
            {t("admin.customers.backToCustomers")}
          </Button>
        </Link>
      }
    />
  );
}
