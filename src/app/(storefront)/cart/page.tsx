import type { Metadata } from "next";

import { CartView } from "@/features/cart/components/CartView";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the products in your shopping cart.",
};

/**
 * Cart route — `/cart`.
 *
 * Composition root: loads StoreSettings for locale/currency formatting,
 * renders client CartView over the Zustand store. No Firebase cart reads.
 */
export default async function CartPage() {
  const settings = await getStoreSettings();

  return (
    <section
      className="storefront-section scroll-mt-[var(--storefront-navbar-height)]"
      aria-label="Shopping cart"
    >
      <div className="storefront-container">
        <CartView locale={settings.locale} currency={settings.currency} />
      </div>
    </section>
  );
}
