"use client";

import type { AdminOrderView } from "@/features/admin/orders/admin-order-view";
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/features/orders/lib/order-status";
import { useT } from "@/i18n";

type OrderTimelineProps = {
  order: AdminOrderView;
  locale: string;
};

type TimelineEntry = {
  id: string;
  title: string;
  detail: string;
  at: string;
};

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Derived order timeline (RFC-014) — no persisted event subcollection.
 */
export function OrderTimeline({ order, locale }: OrderTimelineProps) {
  const t = useT();

  const entries: TimelineEntry[] = [
    {
      id: "created",
      title: t("admin.orders.timeline.orderCreated"),
      detail: t("admin.orders.timeline.reference", {
        orderNumber: order.orderNumber,
      }),
      at: order.createdAt,
    },
    {
      id: "payment",
      title: t("admin.orders.timeline.paymentStatus"),
      detail: getPaymentStatusLabel(order.payment.status, t),
      at: order.payment.paidAt ?? order.updatedAt,
    },
    {
      id: "fulfillment",
      title: t("admin.orders.timeline.fulfillmentStatus"),
      detail: getOrderStatusLabel(order.status, t),
      at: order.updatedAt,
    },
  ];

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="border-l-2 border-border pl-3"
        >
          <p className="text-sm font-medium text-foreground">{entry.title}</p>
          <p className="text-sm text-muted-foreground">{entry.detail}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(entry.at, locale)}
          </p>
        </li>
      ))}
    </ol>
  );
}
