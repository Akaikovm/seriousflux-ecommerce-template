import type { CheckoutShippingMethod } from "@/features/checkout/types";
import type { TranslateFn } from "@/i18n";

/**
 * v1 shipping catalog — local config only (no provider, no settings/shipping doc).
 *
 * Multiple methods can be appended later without changing Order snapshots.
 * English label is the fallback for logs / snapshots when `t` is omitted.
 */
export const STANDARD_SHIPPING_METHOD: CheckoutShippingMethod = {
  id: "standard",
  label: "Standard Shipping",
  cost: 0,
};

export function getAvailableShippingMethods(
  t?: TranslateFn,
): CheckoutShippingMethod[] {
  return [
    {
      id: STANDARD_SHIPPING_METHOD.id,
      label: t
        ? t("checkout.standardShipping")
        : STANDARD_SHIPPING_METHOD.label,
      cost: STANDARD_SHIPPING_METHOD.cost,
    },
  ];
}

export function getShippingMethodById(
  id: string,
  t?: TranslateFn,
): CheckoutShippingMethod | undefined {
  return getAvailableShippingMethods(t).find((method) => method.id === id);
}
