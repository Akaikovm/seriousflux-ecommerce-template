/**
 * Server orchestration for Mercado Pago preference creation (RFC-016 / GAP-004).
 *
 * Loads the order, creates the Checkout Pro preference, and persists
 * preference metadata through AdminOrderService — never via direct Firestore writes.
 */

import { AdminOrderService } from "@/features/orders/services/order.admin";
import { PaymentError } from "@/features/payments/services/payment-error";
import { createMercadoPagoPreference } from "./mercadopago.preference";

type CreateMercadoPagoCheckoutResult = {
  checkoutUrl: string;
  preferenceId: string;
  externalReference: string;
  orderId: string;
};

export async function createMercadoPagoCheckoutForOrder(
  orderId: string,
  orderService: AdminOrderService = new AdminOrderService(),
): Promise<CreateMercadoPagoCheckoutResult> {
  if (!orderId.trim()) {
    throw new PaymentError("Order id is required.", "invalid-method");
  }

  const order = await orderService.getById(orderId.trim());
  if (!order) {
    throw new PaymentError("Order not found.", "checkout-failed");
  }

  if (order.payment.provider !== "mercadopago") {
    throw new PaymentError(
      "Order is not configured for Mercado Pago.",
      "invalid-method",
    );
  }

  const preference = await createMercadoPagoPreference(order);

  await orderService.updatePayment(order.id, {
    status: order.payment.status,
    preferenceId: preference.preferenceId,
    externalReference: preference.externalReference,
    provider: "mercadopago",
  });

  return {
    checkoutUrl: preference.checkoutUrl,
    preferenceId: preference.preferenceId,
    externalReference: preference.externalReference,
    orderId: order.id,
  };
}
