import type {
  PaymentCheckoutContext,
  PaymentCheckoutResult,
  PaymentProvider,
} from "@/features/payments/types";

function notImplemented(method: string): never {
  throw new Error(`${method} is not implemented yet (RFC-015 foundation).`);
}

/**
 * Cash on Delivery provider (RFC-015).
 *
 * No external payment session — order is confirmed immediately with
 * `payment.status: pending` until collected on delivery (RFC-014 admin flow).
 */
export class CashOnDeliveryProvider implements PaymentProvider {
  readonly id = "cash_on_delivery" as const;

  async createCheckout(
    context: PaymentCheckoutContext,
  ): Promise<PaymentCheckoutResult> {
    const params = new URLSearchParams({
      order: context.orderId,
      ref: context.orderNumber,
    });

    return {
      redirectUrl: `/checkout/confirmation?${params.toString()}`,
    };
  }

  async capturePayment(): Promise<void> {
    notImplemented("CashOnDeliveryProvider.capturePayment");
  }

  async refund(): Promise<void> {
    notImplemented("CashOnDeliveryProvider.refund");
  }
}

export const cashOnDeliveryProvider = new CashOnDeliveryProvider();
