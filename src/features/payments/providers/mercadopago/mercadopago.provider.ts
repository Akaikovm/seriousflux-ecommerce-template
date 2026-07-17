import type {
  PaymentCheckoutContext,
  PaymentCheckoutResult,
  PaymentProvider,
} from "@/features/payments/types";
import { PaymentError } from "@/features/payments/services/payment-error";

function notImplemented(method: string): never {
  throw new PaymentError(
    `${method} is not implemented yet.`,
    "provider-error",
  );
}

type PreferenceApiResponse = {
  checkoutUrl?: string;
  preferenceId?: string;
  error?: string;
};

/**
 * Mercado Pago Checkout Pro provider (RFC-016).
 *
 * Preference creation and Access Token usage stay on the server
 * (`/api/payments/mercadopago/preference`). This class keeps Checkout
 * provider-agnostic: it only returns the Checkout Pro redirect URL.
 */
export class MercadoPagoProvider implements PaymentProvider {
  readonly id = "mercadopago" as const;

  async createCheckout(
    context: PaymentCheckoutContext,
  ): Promise<PaymentCheckoutResult> {
    const orderId = context.orderId;

    let response: Response;
    try {
      response = await fetch("/api/payments/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
    } catch (error) {
      throw new PaymentError(
        "We could not reach Mercado Pago checkout. Please try again.",
        "provider-error",
        { cause: error },
      );
    }

    let payload: PreferenceApiResponse = {};
    try {
      payload = (await response.json()) as PreferenceApiResponse;
    } catch {
      payload = {};
    }

    if (!response.ok || !payload.checkoutUrl) {
      throw new PaymentError(
        payload.error ??
          "We could not start Mercado Pago checkout. Please try again.",
        "provider-error",
      );
    }

    return { redirectUrl: payload.checkoutUrl };
  }

  async capturePayment(): Promise<void> {
    notImplemented("MercadoPagoProvider.capturePayment");
  }

  async refund(): Promise<void> {
    notImplemented("MercadoPagoProvider.refund");
  }
}

export const mercadoPagoProvider = new MercadoPagoProvider();
