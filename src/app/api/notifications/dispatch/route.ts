import { NextResponse } from "next/server";

import { assertDispatchSecret } from "@/features/notifications/lib/assert-dispatch-secret";
import { dispatchNotificationSafely } from "@/features/notifications/lib/dispatch-notification";
import {
  notificationDispatchSchema,
  toNotificationTrigger,
} from "@/features/notifications/lib/dispatch-schema";

export const runtime = "nodejs";

/**
 * Transactional email dispatch (RFC-019 / GAP-003).
 *
 * POST /api/notifications/dispatch
 *
 * Server-to-server only: requires `NOTIFICATIONS_DISPATCH_SECRET`
 * (`x-notifications-dispatch-secret` or `Authorization: Bearer …`).
 *
 * Browser UI uses `requestNotification` → server action instead.
 * Mercado Pago webhook calls `dispatchNotificationSafely` directly.
 */
export async function POST(request: Request) {
  const secretCheck = assertDispatchSecret(request);
  if (!secretCheck.ok) {
    return NextResponse.json(
      { ok: false, error: secretCheck.error },
      { status: secretCheck.status },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = notificationDispatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid notification payload." },
      { status: 400 },
    );
  }

  const result = await dispatchNotificationSafely(
    toNotificationTrigger(parsed.data),
  );

  // Always 202 — email outcome must not fail the client business flow.
  return NextResponse.json(
    {
      ok: true,
      result,
    },
    { status: 202 },
  );
}
