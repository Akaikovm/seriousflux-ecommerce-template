import type { Metadata } from "next";

import { CheckoutConfirmation } from "@/features/checkout/components/CheckoutConfirmation";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { Container } from "@/shared/components/Container";
import { Section } from "@/shared/components/Section";

export const metadata: Metadata = {
  title: "Order confirmation",
  description: "Your order has been received.",
};

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
  const params = await searchParams;
  const orderId = params.order?.trim() || null;
  const orderNumber = params.ref?.trim() || null;

  return (
    <Section aria-label="Order confirmation" className="py-10 sm:py-14">
      <Container>
        <CheckoutConfirmation
          orderId={orderId}
          orderNumber={orderNumber}
          storeName={settings.storeName}
        />
      </Container>
    </Section>
  );
}
