import Link from "next/link";

import { createT, getDictionary, resolveLanguage } from "@/i18n";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";

/**
 * Admin customer not found — `/admin/customers/[customerId]`.
 */
export default async function AdminCustomerNotFound() {
  const settings = await getStoreSettings();
  const t = createT(getDictionary(resolveLanguage(settings.language)));

  return (
    <EmptyState
      title={t("admin.customers.notFoundTitle")}
      description={t("admin.customers.notFoundDescription")}
      action={
        <Link href="/admin/customers">
          <Button type="button">{t("admin.customers.backToCustomers")}</Button>
        </Link>
      }
    />
  );
}
