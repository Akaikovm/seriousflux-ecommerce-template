import { z } from "zod";

import type {
  NotificationDispatchInput,
  NotificationTrigger,
} from "@/features/notifications/types";

/** Zod schema for HTTP + server-action notification dispatch payloads. */
export const notificationDispatchSchema = z.discriminatedUnion("event", [
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

export function toNotificationTrigger(
  input: NotificationDispatchInput,
): NotificationTrigger {
  if (input.event === "account.welcome") {
    return {
      type: "account.welcome",
      email: input.email,
      displayName: input.displayName,
      customerId: input.customerId,
    };
  }

  return {
    type: input.event,
    orderId: input.orderId,
  };
}
