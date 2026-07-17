import type { Metadata } from "next";

import { CartView } from "@/features/cart/components/CartView";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { Container } from "@/shared/components/Container";
import { Section } from "@/shared/components/Section";

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
    <Section aria-label="Shopping cart" className="py-10 sm:py-14">
      <Container>
        <CartView locale={settings.locale} currency={settings.currency} />
      </Container>
    </Section>
  );
}
