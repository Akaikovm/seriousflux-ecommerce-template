import { z } from "zod";

import { PAYMENT_METHODS } from "@/features/payments/types";
import type { TranslateFn } from "@/i18n";

/**
 * Builds a Zod schema with localized validation messages.
 * Call inside components with `t` from `useT()`.
 */
export function createCheckoutFormSchema(t: TranslateFn) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(1, t("checkout.validation.fullNameRequired")),
    email: z
      .string()
      .trim()
      .min(1, t("checkout.validation.emailRequired"))
      .email(t("checkout.validation.emailInvalid")),
    phone: z.string().trim().min(1, t("checkout.validation.phoneRequired")),
    address: z.string().trim().min(1, t("checkout.validation.addressRequired")),
    city: z.string().trim().min(1, t("checkout.validation.cityRequired")),
    state: z.string().trim().min(1, t("checkout.validation.stateRequired")),
    postalCode: z
      .string()
      .trim()
      .min(1, t("checkout.validation.postalCodeRequired")),
    country: z.string().trim().min(1, t("checkout.validation.countryRequired")),
    shippingMethodId: z
      .string()
      .trim()
      .min(1, t("checkout.validation.shippingRequired")),
    paymentMethod: z.enum(PAYMENT_METHODS, {
      message: t("checkout.validation.paymentRequired"),
    }),
  });
}

export type CheckoutFormSchemaValues = z.infer<
  ReturnType<typeof createCheckoutFormSchema>
>;
