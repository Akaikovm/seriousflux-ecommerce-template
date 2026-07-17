import { NextResponse } from "next/server";

import { OrderError } from "@/features/orders/services";
import { processMercadoPagoWebhook } from "@/features/payments/providers/mercadopago/mercadopago.webhook";
import { PaymentError } from "@/features/payments/services";

export const runtime = "nodejs";

/**
 * Mercado Pago payment notifications (RFC-016).
 *
 * POST /api/webhooks/mercadopago
 *
 * Validates signature, fetches payment from Mercado Pago API, updates order
 * via OrderService. Idempotent for duplicate notifications.
 */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    let body: unknown = null;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        body = null;
      }
    } else {
      try {
        const text = await request.text();
        body = text ? JSON.parse(text) : null;
      } catch {
        body = null;
      }
    }

    const result = await processMercadoPagoWebhook({
      headers: request.headers,
      query: url.searchParams,
      body,
    });

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    if (error instanceof PaymentError && error.code === "webhook-invalid") {
      return NextResponse.json(
        { ok: false, error: "Invalid webhook." },
        { status: 401 },
      );
    }

    if (error instanceof OrderError && error.code === "not-found") {
      // Acknowledge so Mercado Pago does not retry forever for unknown refs.
      console.warn("[mercadopago.webhook] order not found");
      return NextResponse.json(
        { ok: false, error: "Order not found." },
        { status: 200 },
      );
    }

    // Provider / Firestore / unexpected — 500 so Mercado Pago can retry.
    console.error("[mercadopago.webhook] processing failed", {
      code:
        error instanceof PaymentError || error instanceof OrderError
          ? error.code
          : "unknown",
    });
    return NextResponse.json(
      { ok: false, error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}

/** Mercado Pago may probe the endpoint with GET during configuration. */
export async function GET() {
  return NextResponse.json({ ok: true, provider: "mercadopago" });
}
