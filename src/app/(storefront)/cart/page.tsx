import type { Metadata } from "next";

import { CartView } from "@/features/cart/components/CartView";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { createT, getDictionary, resolveLanguage } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const t = createT(getDictionary(resolveLanguage(settings.language)));
  return {
    title: t("cart.title"),
    description: t("cart.pageDescription"),
  };
}

/**
 * Cart route — `/cart`.
 *
 * Composition root: loads StoreSettings for locale/currency formatting,
 * renders client CartView over the Zustand store. No Firebase cart reads.
 */
export default async function CartPage() {
  const settings = await getStoreSettings();
  const t = createT(getDictionary(resolveLanguage(settings.language)));

  return (
    <section
      className="storefront-section scroll-mt-[var(--storefront-navbar-height)]"
      aria-label={t("cart.pageAria")}
    >
      <div className="storefront-container">
        <CartView locale={settings.locale} currency={settings.currency} />
      </div>
    </section>
  );
}
