import type { CheckoutShippingMethod } from "@/features/checkout/types";

/**
 * v1 shipping catalog — local config only (no provider, no settings/shipping doc).
 *
 * Multiple methods can be appended later without changing Order snapshots.
 */
export const STANDARD_SHIPPING_METHOD: CheckoutShippingMethod = {
  id: "standard",
  label: "Standard Shipping",
  cost: 0,
};

export function getAvailableShippingMethods(): CheckoutShippingMethod[] {
  return [STANDARD_SHIPPING_METHOD];
}

export function getShippingMethodById(
  id: string,
): CheckoutShippingMethod | undefined {
  return getAvailableShippingMethods().find((method) => method.id === id);
}
