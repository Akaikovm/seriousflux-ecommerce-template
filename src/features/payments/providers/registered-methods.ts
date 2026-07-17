import type { PaymentMethod } from "@/features/payments/types";

/**
 * Method ids that have a concrete `PaymentProvider` implementation.
 *
 * Kept separate from `providers/index.ts` so settings resolution can filter
 * without importing provider SDKs or client modules.
 *
 * When registering a new provider, add its id here AND in the registry Map.
 */
const REGISTERED_PAYMENT_METHODS: readonly PaymentMethod[] = [
  "mercadopago",
  "cash_on_delivery",
] as const;

const REGISTERED_SET: ReadonlySet<string> = new Set(REGISTERED_PAYMENT_METHODS);

export function isPaymentProviderRegistered(method: PaymentMethod): boolean {
  return REGISTERED_SET.has(method);
}
