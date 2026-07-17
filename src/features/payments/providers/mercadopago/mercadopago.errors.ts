import { PaymentError } from "@/features/payments/services/payment-error";

/**
 * Maps unknown Mercado Pago / network failures into domain PaymentErrors.
 * Never surfaces raw SDK messages to Checkout.
 */
export function toMercadoPagoPaymentError(error: unknown): PaymentError {
  if (error instanceof PaymentError) {
    return error;
  }

  return new PaymentError(
    "We could not start Mercado Pago checkout. Please try again.",
    "provider-error",
    { cause: error },
  );
}

export function toMercadoPagoWebhookError(error: unknown): PaymentError {
  if (error instanceof PaymentError) {
    return error;
  }

  // API / network failures must not be reported as invalid signatures (401).
  // Use provider-error so the route returns 500 and Mercado Pago can retry.
  return new PaymentError(
    "Mercado Pago webhook could not be processed.",
    "provider-error",
    { cause: error },
  );
}
