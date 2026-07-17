import type { Metadata } from "next";

import { CheckoutView } from "@/features/checkout/components/CheckoutView";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { Container } from "@/shared/components/Container";
import { Section } from "@/shared/components/Section";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase.",
};

/**
 * Checkout route — `/checkout`.
 *
 * Composition root: loads StoreSettings for locale/currency/country/shipping flag.
 * Client CheckoutView reads CartStore and creates Orders via OrderService.
 */
export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  return (
    <Section aria-label="Checkout" className="py-10 sm:py-14">
      <Container>
        <CheckoutView
          currency={settings.currency}
          locale={settings.locale}
          country={settings.country}
          shippingEnabled={settings.shippingEnabled}
        />
      </Container>
    </Section>
  );
}
