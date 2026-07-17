import { cashOnDeliveryProvider } from "@/features/payments/providers/cash-on-delivery";
import { mercadoPagoProvider } from "@/features/payments/providers/mercadopago";
import type { PaymentMethod, PaymentProvider } from "@/features/payments/types";

export { isPaymentProviderRegistered } from "@/features/payments/providers/registered-methods";

/**
 * Internal registry of implemented providers (RFC-016.5).
 *
 * To add a new provider later:
 * 1. Implement `PaymentProvider`
 * 2. Add its id to the registered set in `registered-methods.ts`
 * 3. Register it in this Map
 * 4. Enable it in Store Settings (`paymentProviders`)
 *
 * Checkout does not need changes — it only renders registry ∩ enabled settings.
 */
export const paymentProviders: ReadonlyMap<PaymentMethod, PaymentProvider> =
  new Map<PaymentMethod, PaymentProvider>([
    ["mercadopago", mercadoPagoProvider],
    ["cash_on_delivery", cashOnDeliveryProvider],
  ]);

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  const provider = paymentProviders.get(method);
  if (!provider) {
    throw new Error(`No payment provider registered for method "${method}".`);
  }
  return provider;
}
