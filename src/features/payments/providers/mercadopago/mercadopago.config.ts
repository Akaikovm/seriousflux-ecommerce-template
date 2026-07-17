/**
 * Mercado Pago configuration (RFC-016 / RFC-016.5).
 *
 * Each payment provider owns its own env module (this file is MP-only).
 * Credentials are read exclusively from environment variables — never from
 * Firestore StoreSettings (which holds only public enable/display config).
 *
 * Access token and webhook secret are server-only — never expose them
 * to the client bundle.
 */

type MercadoPagoConfigValues = {
  accessToken: string;
  webhookSecret: string;
  /** When true, redirect buyers to `sandbox_init_point`. */
  sandbox: boolean;
  /** Absolute storefront origin used for back_urls and notification_url. */
  appUrl: string;
};

function requireEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(
      `Missing environment variable: ${name}. Copy .env.example to .env.local and fill Mercado Pago values.`,
    );
  }
  return value.trim();
}

function parseSandbox(value: string | undefined): boolean {
  if (!value?.trim()) {
    return true;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "sandbox";
}

/**
 * Server-only Mercado Pago credentials for webhooks (signature + Payment.get).
 * Call only from Route Handlers / server modules — never from client components.
 */
export function getMercadoPagoConfig(): MercadoPagoConfigValues {
  return {
    accessToken: requireEnv(
      "MERCADOPAGO_ACCESS_TOKEN",
      process.env.MERCADOPAGO_ACCESS_TOKEN,
    ),
    webhookSecret: requireEnv(
      "MERCADOPAGO_WEBHOOK_SECRET",
      process.env.MERCADOPAGO_WEBHOOK_SECRET,
    ),
    sandbox: parseSandbox(process.env.MERCADOPAGO_SANDBOX),
    appUrl: requireEnv(
      "NEXT_PUBLIC_APP_URL",
      process.env.NEXT_PUBLIC_APP_URL,
    ).replace(/\/$/, ""),
  };
}

/**
 * Config for preference creation (webhook secret not required on this path).
 */
export function getMercadoPagoCheckoutConfig(): Omit<
  MercadoPagoConfigValues,
  "webhookSecret"
> {
  return {
    accessToken: requireEnv(
      "MERCADOPAGO_ACCESS_TOKEN",
      process.env.MERCADOPAGO_ACCESS_TOKEN,
    ),
    sandbox: parseSandbox(process.env.MERCADOPAGO_SANDBOX),
    appUrl: requireEnv(
      "NEXT_PUBLIC_APP_URL",
      process.env.NEXT_PUBLIC_APP_URL,
    ).replace(/\/$/, ""),
  };
}
