import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";

import {
  commitSaleSafelyWithAdmin,
  restoreSaleSafelyWithAdmin,
} from "@/features/inventory/services/inventory.admin";
import { dispatchNotificationSafely } from "@/features/notifications/lib/dispatch-notification";
import { OrderError } from "@/features/orders/services";
import { AdminOrderService } from "@/features/orders/services/order.admin";
import { PaymentError } from "@/features/payments/services/payment-error";
import { getMercadoPagoConfig } from "./mercadopago.config";
import { toMercadoPagoWebhookError } from "./mercadopago.errors";
import { verifyMercadoPagoPayment } from "./mercadopago.verify";

type MercadoPagoWebhookProcessResult = {
  handled: boolean;
  orderId?: string;
  paymentId?: string;
  paymentStatus?: string;
  orderStatus?: string;
  skippedReason?: string;
};

function headerValue(value: string | null): string | undefined {
  return value ?? undefined;
}

/**
 * Extracts a payment id from Mercado Pago webhook / IPN shapes.
 */
function extractMercadoPagoPaymentId(input: {
  query: URLSearchParams;
  body: unknown;
}): string | null {
  const queryDataId = input.query.get("data.id")?.trim();
  if (queryDataId) {
    return queryDataId;
  }

  const topic = input.query.get("topic")?.trim().toLowerCase();
  const queryId = input.query.get("id")?.trim();
  if (topic === "payment" && queryId) {
    return queryId;
  }

  const type = input.query.get("type")?.trim().toLowerCase();
  if (type === "payment" && queryId) {
    return queryId;
  }

  if (input.body && typeof input.body === "object") {
    const body = input.body as Record<string, unknown>;
    const bodyType =
      typeof body.type === "string" ? body.type.toLowerCase() : "";
    const bodyTopic =
      typeof body.topic === "string" ? body.topic.toLowerCase() : "";

    if (bodyType === "payment" || bodyTopic === "payment") {
      const data = body.data;
      if (data && typeof data === "object") {
        const dataId = (data as Record<string, unknown>).id;
        if (typeof dataId === "string" && dataId.trim()) {
          return dataId.trim();
        }
        if (typeof dataId === "number") {
          return String(dataId);
        }
      }
      if (typeof body.id === "string" && body.id.trim()) {
        return body.id.trim();
      }
      if (typeof body.id === "number") {
        return String(body.id);
      }
    }
  }

  return null;
}

/**
 * Validates signature, verifies payment via Mercado Pago API, updates order
 * through AdminOrderService (GAP-004). Idempotent for duplicate notifications.
 */
export async function processMercadoPagoWebhook(input: {
  headers: Headers;
  query: URLSearchParams;
  body: unknown;
  orderService?: AdminOrderService;
}): Promise<MercadoPagoWebhookProcessResult> {
  try {
    const config = getMercadoPagoConfig();
    const dataId =
      input.query.get("data.id") ??
      extractMercadoPagoPaymentId({ query: input.query, body: input.body });

    try {
      WebhookSignatureValidator.validate({
        xSignature: headerValue(input.headers.get("x-signature")),
        xRequestId: headerValue(input.headers.get("x-request-id")),
        dataId,
        secret: config.webhookSecret,
        toleranceSeconds: 300,
      });
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        console.warn("[mercadopago.webhook] invalid signature", {
          reason: error.reason,
          requestId: error.requestId,
        });
        throw new PaymentError(
          "Invalid Mercado Pago webhook signature.",
          "webhook-invalid",
          { cause: error },
        );
      }
      throw error;
    }

    const paymentId = extractMercadoPagoPaymentId({
      query: input.query,
      body: input.body,
    });

    if (!paymentId) {
      return {
        handled: false,
        skippedReason: "not-a-payment-notification",
      };
    }

    const verified = await verifyMercadoPagoPayment(paymentId);
    const orderId = verified.externalReference;

    if (!orderId) {
      console.error(
        "[mercadopago.webhook] payment missing external_reference",
        { paymentId: verified.paymentId },
      );
      return {
        handled: false,
        paymentId: verified.paymentId,
        skippedReason: "missing-external-reference",
      };
    }

    const orderService = input.orderService ?? new AdminOrderService();
    const previous = await orderService.getById(orderId);
    const previousPaymentStatus = previous?.payment.status;

    const updated = await orderService.updatePayment(orderId, {
      status: verified.orderPaymentStatus,
      paymentId: verified.paymentId,
      preferenceId: verified.preferenceId ?? undefined,
      externalReference: verified.externalReference ?? orderId,
      approvedAt: verified.approvedAt ?? undefined,
      provider: "mercadopago",
    });

    if (previousPaymentStatus !== updated.payment.status) {
      if (updated.payment.status === "paid") {
        await commitSaleSafelyWithAdmin(updated.id);
        await dispatchNotificationSafely({
          type: "payment.approved",
          orderId: updated.id,
        });
      } else if (updated.payment.status === "failed") {
        await dispatchNotificationSafely({
          type: "payment.failed",
          orderId: updated.id,
        });
      } else if (updated.payment.status === "refunded") {
        await restoreSaleSafelyWithAdmin(updated.id);
      }
    }

    return {
      handled: true,
      orderId: updated.id,
      paymentId: verified.paymentId,
      paymentStatus: verified.orderPaymentStatus,
      orderStatus: updated.status,
    };
  } catch (error) {
    if (error instanceof OrderError || error instanceof PaymentError) {
      throw error;
    }
    throw toMercadoPagoWebhookError(error);
  }
}
