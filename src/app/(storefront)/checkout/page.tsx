import type { Metadata } from "next";

import { CheckoutView } from "@/features/checkout/components/CheckoutView";
import { resolveCheckoutPaymentOptions } from "@/features/payments/lib/resolve-enabled-payment-methods";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase.",
};

/**
 * Checkout route — `/checkout`.
 *
 * Composition root: loads StoreSettings for locale/currency/country/shipping flag
 * and configuration-driven payment options (RFC-016.5).
 * Client CheckoutView reads CartStore and creates Orders via PaymentService.
 */
export default async function CheckoutPage() {
  const settings = await getStoreSettings();
  const paymentOptions = resolveCheckoutPaymentOptions(settings);

  return (
    <section
      className="storefront-section scroll-mt-[var(--storefront-navbar-height)]"
      aria-label="Checkout"
    >
      <div className="storefront-container">
        <CheckoutView
          currency={settings.currency}
          locale={settings.locale}
          country={settings.country}
          shippingEnabled={settings.shippingEnabled}
          paymentOptions={paymentOptions}
        />
      </div>
    </section>
  );
}
