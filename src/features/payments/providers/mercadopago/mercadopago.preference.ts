import type { Order } from "@/features/orders/types";
import { PaymentError } from "@/features/payments/services/payment-error";
import { getPreferenceClient } from "./mercadopago.client";
import { getMercadoPagoCheckoutConfig } from "./mercadopago.config";
import { toMercadoPagoPaymentError } from "./mercadopago.errors";

type MercadoPagoPreferenceResult = {
  preferenceId: string;
  checkoutUrl: string;
  externalReference: string;
};

function buildConfirmationUrl(
  appUrl: string,
  order: Order,
  status?: "pending" | "failure",
): string {
  const params = new URLSearchParams({
    order: order.id,
    ref: order.orderNumber,
  });
  if (status) {
    params.set("status", status);
  }
  return `${appUrl}/checkout/confirmation?${params.toString()}`;
}

/**
 * Builds Checkout Pro preference items from an existing Order.
 * Reuses Order line snapshots and totals — does not reprice.
 */
function buildPreferenceItems(order: Order) {
  const currency = order.currency;
  const items = order.items.map((item) => ({
    id: item.productId,
    title: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    currency_id: currency,
    picture_url: item.image || undefined,
  }));

  if (order.totals.shipping > 0) {
    items.push({
      id: `shipping-${order.shippingMethod.id}`,
      title: order.shippingMethod.label || "Shipping",
      quantity: 1,
      unit_price: order.totals.shipping,
      currency_id: currency,
      picture_url: undefined,
    });
  }

  if (order.totals.tax > 0) {
    items.push({
      id: `tax-${order.id}`,
      title: "Tax",
      quantity: 1,
      unit_price: order.totals.tax,
      currency_id: currency,
      picture_url: undefined,
    });
  }

  if (order.totals.discount > 0) {
    items.push({
      id: `discount-${order.id}`,
      title: "Discount",
      quantity: 1,
      unit_price: -Math.abs(order.totals.discount),
      currency_id: currency,
      picture_url: undefined,
    });
  }

  return items;
}

/**
 * Mercado Pago strips non-public back_urls (e.g. http://localhost) and then
 * rejects `auto_return` with "back_url.success must be defined".
 * Only enable auto_return when the storefront origin is publicly reachable.
 */
function isPublicAppUrl(appUrl: string): boolean {
  try {
    const { hostname, protocol } = new URL(appUrl);
    if (protocol !== "http:" && protocol !== "https:") {
      return false;
    }
    const host = hostname.toLowerCase();
    return (
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      host !== "[::1]" &&
      !host.endsWith(".local")
    );
  } catch {
    return false;
  }
}

/**
 * Creates a Mercado Pago Checkout Pro preference for an existing order.
 * Server-only — uses the Access Token.
 */
export async function createMercadoPagoPreference(
  order: Order,
): Promise<MercadoPagoPreferenceResult> {
  try {
    const config = getMercadoPagoCheckoutConfig();
    const externalReference = order.id;
    const successUrl = buildConfirmationUrl(config.appUrl, order);
    const pendingUrl = buildConfirmationUrl(config.appUrl, order, "pending");
    const failureUrl = buildConfirmationUrl(config.appUrl, order, "failure");
    const publicOrigin = isPublicAppUrl(config.appUrl);

    const preference = getPreferenceClient();
    const response = await preference.create({
      body: {
        external_reference: externalReference,
        items: buildPreferenceItems(order),
        payer: {
          name: order.customerName,
          email: order.customerEmail,
        },
        // Localhost back_urls / notification_url are unreachable by MP.
        ...(publicOrigin
          ? {
              back_urls: {
                success: successUrl,
                pending: pendingUrl,
                failure: failureUrl,
              },
              auto_return: "approved" as const,
              notification_url: `${config.appUrl}/api/webhooks/mercadopago`,
            }
          : {}),
        metadata: {
          order_id: order.id,
          order_number: order.orderNumber,
        },
      },
      requestOptions: {
        idempotencyKey: `preference-${order.id}`,
      },
    });

    const preferenceId = response.id;
    if (!preferenceId) {
      throw new PaymentError(
        "Mercado Pago did not return a preference id.",
        "provider-error",
      );
    }

    if (!publicOrigin) {
      console.warn(
        "[mercadopago.preference] NEXT_PUBLIC_APP_URL is not a public origin; notification_url omitted — orders will not auto-sync after payment",
      );
    }

    const checkoutUrl = config.sandbox
      ? response.sandbox_init_point
      : response.init_point;

    if (!checkoutUrl) {
      throw new PaymentError(
        "Mercado Pago did not return a checkout URL.",
        "provider-error",
      );
    }

    return {
      preferenceId,
      checkoutUrl,
      externalReference,
    };
  } catch (error) {
    throw toMercadoPagoPaymentError(error);
  }
}
