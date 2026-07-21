import type { Metadata } from "next";

import { CheckoutConfirmation } from "@/features/checkout/components/CheckoutConfirmation";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { createT, getDictionary, resolveLanguage } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const t = createT(getDictionary(resolveLanguage(settings.language)));
  return {
    title: t("checkout.confirmationPageTitle"),
    description: t("checkout.confirmationPageDescription"),
  };
}

type ConfirmationPageProps = {
  searchParams: Promise<{ order?: string; ref?: string }>;
};

/**
 * Confirmation route — `/checkout/confirmation?order=<orderId>`.
 *
 * Optional `ref` carries the human-friendly `orderNumber` for display.
 * The page never renders the raw Firestore document id.
 * Does not read CartStore.
 */
export default async function CheckoutConfirmationPage({
  searchParams,
}: ConfirmationPageProps) {
  const settings = await getStoreSettings();
  const t = createT(getDictionary(resolveLanguage(settings.language)));
  const params = await searchParams;
  const orderId = params.order?.trim() || null;
  const orderNumber = params.ref?.trim() || null;

  return (
    <section
      className="storefront-section scroll-mt-[var(--storefront-navbar-height)]"
      aria-label={t("checkout.confirmationPageAria")}
    >
      <div className="storefront-container">
        <CheckoutConfirmation
          orderId={orderId}
          orderNumber={orderNumber}
          storeName={settings.storeName}
          logo={settings.logo}
        />
      </div>
    </section>
  );
}
