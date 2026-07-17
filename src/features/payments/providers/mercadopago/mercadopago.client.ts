import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

import { getMercadoPagoCheckoutConfig } from "./mercadopago.config";

/**
 * Shared Mercado Pago SDK clients (server-only).
 */

let configSingleton: MercadoPagoConfig | null = null;

function getSdkConfig(): MercadoPagoConfig {
  if (!configSingleton) {
    const { accessToken } = getMercadoPagoCheckoutConfig();
    configSingleton = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 10_000 },
    });
  }
  return configSingleton;
}

export function getPreferenceClient(): Preference {
  return new Preference(getSdkConfig());
}

export function getPaymentClient(): Payment {
  return new Payment(getSdkConfig());
}
