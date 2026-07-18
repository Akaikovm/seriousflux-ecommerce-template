import { NextResponse } from "next/server";
import { z } from "zod";

import { dispatchNotificationSafely } from "@/features/notifications/lib/dispatch-notification";
import type { NotificationTrigger } from "@/features/notifications/types";

export const runtime = "nodejs";

const dispatchSchema = z.discriminatedUnion("event", [
  z.object({
    event: z.literal("order.created"),
    orderId: z.string().trim().min(1),
  }),
  z.object({
    event: z.literal("payment.approved"),
    orderId: z.string().trim().min(1),
  }),
  z.object({
    event: z.literal("payment.failed"),
    orderId: z.string().trim().min(1),
  }),
  z.object({
    event: z.literal("order.cancelled"),
    orderId: z.string().trim().min(1),
  }),
  z.object({
    event: z.literal("order.shipped"),
    orderId: z.string().trim().min(1),
  }),
  z.object({
    event: z.literal("account.welcome"),
    email: z.string().trim().email(),
    displayName: z.string().trim().optional(),
    customerId: z.string().trim().optional(),
  }),
]);

/**
 * Transactional email dispatch (RFC-019).
 *
 * POST /api/notifications/dispatch
 *
 * External integrations (email providers) run only on the server.
 * Callers fire-and-forget after successful business operations.
 * Failures are logged and never roll back orders / auth.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = dispatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid notification payload." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const trigger: NotificationTrigger =
    data.event === "account.welcome"
      ? {
          type: "account.welcome",
          email: data.email,
          displayName: data.displayName,
          customerId: data.customerId,
        }
      : {
          type: data.event,
          orderId: data.orderId,
        };

  const result = await dispatchNotificationSafely(trigger);

  // Always 202 — email outcome must not fail the client business flow.
  return NextResponse.json(
    {
      ok: true,
      result,
    },
    { status: 202 },
  );
}
