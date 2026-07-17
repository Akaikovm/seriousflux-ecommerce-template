import { NextResponse } from "next/server";

import { OrderError } from "@/features/orders/services";
import { createMercadoPagoCheckoutForOrder } from "@/features/payments/providers/mercadopago/mercadopago.checkout";
import { PaymentError } from "@/features/payments/services";

export const runtime = "nodejs";

type PreferenceBody = {
  orderId?: string;
};

/**
 * Creates a Mercado Pago Checkout Pro preference for an existing order.
 *
 * POST /api/payments/mercadopago/preference
 * Body: { orderId: string }
 *
 * Access Token stays server-side. Checkout never calls Mercado Pago directly.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PreferenceBody;
    const orderId = typeof body.orderId === "string" ? body.orderId : "";

    const result = await createMercadoPagoCheckoutForOrder(orderId);

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      preferenceId: result.preferenceId,
      externalReference: result.externalReference,
      orderId: result.orderId,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
      const status =
        error.code === "invalid-method"
          ? 400
          : error.code === "checkout-failed"
            ? 404
            : 502;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status },
      );
    }

    if (error instanceof OrderError) {
      const status = error.code === "not-found" ? 404 : 500;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status },
      );
    }

    return NextResponse.json(
      {
        error: "We could not start Mercado Pago checkout. Please try again.",
        code: "unknown",
      },
      { status: 500 },
    );
  }
}
