import { getPaymentClient } from "./mercadopago.client";
import { toMercadoPagoWebhookError } from "./mercadopago.errors";
import { mapMercadoPagoStatusToOrderPaymentStatus } from "./mercadopago.map-status";
import type { OrderPaymentStatus } from "@/features/orders/types";
import { PaymentError } from "@/features/payments/services/payment-error";

type VerifiedMercadoPagoPayment = {
  paymentId: string;
  status: string;
  orderPaymentStatus: OrderPaymentStatus;
  externalReference: string | null;
  preferenceId: string | null;
  approvedAt: Date | null;
};

/**
 * Fetches payment details from Mercado Pago API.
 * Never trusts webhook payload fields alone — always verify via GET /v1/payments/:id.
 */
export async function verifyMercadoPagoPayment(
  paymentId: string,
): Promise<VerifiedMercadoPagoPayment> {
  try {
    if (!paymentId.trim()) {
      throw new PaymentError(
        "Missing Mercado Pago payment id.",
        "webhook-invalid",
      );
    }

    const payment = getPaymentClient();
    const response = await payment.get({ id: paymentId });

    const id = response.id != null ? String(response.id) : "";
    if (!id) {
      throw new PaymentError(
        "Mercado Pago payment response is missing an id.",
        "webhook-invalid",
      );
    }

    const status = typeof response.status === "string" ? response.status : "";
    if (!status) {
      throw new PaymentError(
        "Mercado Pago payment response is missing a status.",
        "webhook-invalid",
      );
    }

    const externalReference =
      typeof response.external_reference === "string" &&
      response.external_reference.trim()
        ? response.external_reference.trim()
        : null;

    const metadata =
      response.metadata && typeof response.metadata === "object"
        ? (response.metadata as Record<string, unknown>)
        : null;
    const preferenceFromMeta =
      metadata && typeof metadata.preference_id === "string"
        ? metadata.preference_id.trim()
        : "";
    const preferenceId = preferenceFromMeta || null;

    const approvedAt =
      status === "approved" && typeof response.date_approved === "string"
        ? new Date(response.date_approved)
        : status === "approved"
          ? new Date()
          : null;

    return {
      paymentId: id,
      status,
      orderPaymentStatus: mapMercadoPagoStatusToOrderPaymentStatus(status),
      externalReference,
      preferenceId,
      approvedAt:
        approvedAt && !Number.isNaN(approvedAt.getTime()) ? approvedAt : null,
    };
  } catch (error) {
    throw toMercadoPagoWebhookError(error);
  }
}
