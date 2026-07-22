import { describe, expect, it } from "vitest";

import {
  mapPaymentProvidersConfig,
  resolveCheckoutPaymentOptions,
  resolvePaymentProvidersConfig,
} from "@/features/payments/lib/resolve-enabled-payment-methods";

describe("payment provider registry selection", () => {
  it("fills defaults when config is missing", () => {
    const config = mapPaymentProvidersConfig(undefined);
    expect(config.mercadopago.enabled).toBe(true);
    expect(config.cashOnDelivery.enabled).toBe(true);
    expect(config.stripe.enabled).toBe(false);
  });

  it("resolves only enabled registered checkout options", () => {
    const options = resolveCheckoutPaymentOptions({
      paymentProviders: {
        ...resolvePaymentProvidersConfig(),
        mercadopago: {
          ...resolvePaymentProvidersConfig().mercadopago,
          enabled: true,
          displayName: "MP",
          sortOrder: 2,
        },
        cashOnDelivery: {
          ...resolvePaymentProvidersConfig().cashOnDelivery,
          enabled: false,
        },
        stripe: {
          ...resolvePaymentProvidersConfig().stripe,
          enabled: true,
        },
      },
    });

    // Stripe is not a registered checkout provider yet — must not appear.
    expect(options.map((option) => option.id)).toEqual(["mercadopago"]);
  });
});
