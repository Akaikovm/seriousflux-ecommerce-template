"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminOrderView } from "@/features/admin/orders/admin-order-view";
import { OrderTimeline } from "@/features/admin/orders/OrderTimeline";
import {
  AdminBreadcrumb,
  AdminPage,
  AdminPageHeader,
  AdminSection,
} from "@/features/admin/ui";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/features/orders/components/PaymentStatusBadge";
import {
  getAdminPaymentStatusOptions,
  getOrderStatusSelectOptions,
  normalizeOrderStatus,
} from "@/features/orders/lib/order-status";
import { OrderError, OrderService } from "@/features/orders/services";
import type {
  OrderPaymentStatus,
  OrderWritableStatus,
} from "@/features/orders/types";
import {
  commitSaleSafely,
  restoreSaleSafely,
} from "@/features/inventory/lib/inventory-order-hooks";
import { requestNotification } from "@/features/notifications";
import { useT, type TranslateFn } from "@/i18n";
import { formatPrice } from "@/lib/format-price";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { useToast } from "@/shared/ui/Toast";

type AdminOrderDetailProps = {
  order: AdminOrderView;
  locale: string;
  currency: string;
};

function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function providerLabel(provider: string, t: TranslateFn): string {
  const key = `payments.providers.${provider}`;
  const label = t(key);
  return label === key ? provider : label;
}

/**
 * Admin order detail (RFC-014).
 * Status / payment / notes mutations go through OrderService only.
 */
export function AdminOrderDetail({
  order,
  locale,
  currency,
}: AdminOrderDetailProps) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();

  const [fulfillmentStatus, setFulfillmentStatus] = useState(
    normalizeOrderStatus(order.status),
  );
  const [paymentStatus, setPaymentStatus] = useState<OrderPaymentStatus>(
    order.payment.status,
  );
  const [notes, setNotes] = useState(order.notes ?? "");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const moneyCurrency = order.currency || currency;

  async function handleUpdateStatus() {
    if (savingStatus) {
      return;
    }

    setSavingStatus(true);
    try {
      const previousStatus = normalizeOrderStatus(order.status);
      await new OrderService().updateStatus(
        order.id,
        fulfillmentStatus as OrderWritableStatus,
      );
      if (
        fulfillmentStatus === "shipped" &&
        previousStatus !== "shipped"
      ) {
        requestNotification({ event: "order.shipped", orderId: order.id });
      } else if (
        fulfillmentStatus === "cancelled" &&
        previousStatus !== "cancelled"
      ) {
        await restoreSaleSafely(order.id);
        requestNotification({ event: "order.cancelled", orderId: order.id });
      }
      toast.success(t("admin.orders.statusUpdated"));
      router.refresh();
    } catch (err) {
      const message =
        err instanceof OrderError
          ? err.message
          : t("admin.orders.statusFailed");
      toast.error(message);
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleUpdatePayment() {
    if (savingPayment) {
      return;
    }

    setSavingPayment(true);
    try {
      const previousPayment = order.payment.status;
      await new OrderService().updatePaymentStatus(order.id, paymentStatus);
      if (paymentStatus === "paid" && previousPayment !== "paid") {
        await commitSaleSafely(order.id);
        requestNotification({
          event: "payment.approved",
          orderId: order.id,
        });
      } else if (paymentStatus === "failed" && previousPayment !== "failed") {
        requestNotification({
          event: "payment.failed",
          orderId: order.id,
        });
      } else if (
        paymentStatus === "refunded" &&
        previousPayment !== "refunded"
      ) {
        await restoreSaleSafely(order.id);
      }
      toast.success(t("admin.orders.paymentUpdated"));
      router.refresh();
    } catch (err) {
      const message =
        err instanceof OrderError
          ? err.message
          : t("admin.orders.paymentFailed");
      toast.error(message);
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleSaveNotes() {
    if (savingNotes) {
      return;
    }

    setSavingNotes(true);
    try {
      await new OrderService().updateNotes(order.id, notes);
      toast.success(t("admin.orders.notesSaved"));
      router.refresh();
    } catch (err) {
      const message =
        err instanceof OrderError ? err.message : t("admin.orders.notesFailed");
      toast.error(message);
    } finally {
      setSavingNotes(false);
    }
  }

  const address = order.shippingAddress;

  return (
    <AdminPage>
      <AdminBreadcrumb
        items={[
          { label: t("admin.orders.title"), href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
      />
      <AdminPageHeader
        eyebrow={t("admin.orders.detailEyebrow")}
        title={t("admin.orders.detailTitle")}
        description={t("admin.orders.detailDescription")}
      />

      {order.inventoryCommitStatus === "shortfall" ? (
        <AdminSection
          title={t("admin.orders.inventoryShortfallTitle")}
          description={t("admin.orders.inventoryShortfallDescription")}
        >
          <Badge variant="secondary">{t("admin.orders.needsManualReview")}</Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("admin.orders.inventoryShortfallHint")}
          </p>
        </AdminSection>
      ) : null}

      <AdminSection title={t("admin.orders.orderSummary")}>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("admin.orders.fields.orderNumber")}
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {order.orderNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("admin.orders.sections.fulfillment")}
            </dt>
            <dd className="mt-1">
              <OrderStatusBadge status={order.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("admin.orders.sections.payment")}
            </dt>
            <dd className="mt-1">
              <PaymentStatusBadge status={order.payment.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("admin.orders.fields.total")}
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {formatPrice(order.totals.total, moneyCurrency, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("admin.orders.fields.createdAt")}
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatDate(order.createdAt, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              {t("admin.orders.fields.updatedAt")}
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatDate(order.updatedAt, locale)}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          {t("admin.orders.firestoreId")}{" "}
          <span className="font-mono text-foreground">{order.id}</span>
        </p>
      </AdminSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title={t("admin.orders.sections.customer")}>
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("admin.orders.fields.name")}
              </dt>
              <dd className="text-foreground">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("admin.orders.fields.email")}
              </dt>
              <dd className="text-foreground">{order.customerEmail}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("admin.orders.fields.phone")}
              </dt>
              <dd className="text-foreground">{order.customerPhone || "—"}</dd>
            </div>
          </dl>
        </AdminSection>

        <AdminSection title={t("admin.orders.shippingAddress")}>
          <address className="text-sm not-italic text-foreground">
            <p>{address.fullName}</p>
            <p>{address.line1}</p>
            {address.line2 ? <p>{address.line2}</p> : null}
            <p>
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p>{address.country}</p>
            {address.phone ? <p className="mt-2">{address.phone}</p> : null}
          </address>
          <p className="text-sm text-muted-foreground">
            {t("admin.orders.shippingMethod", {
              label: order.shippingMethod.label,
              cost: formatPrice(
                order.shippingMethod.cost,
                moneyCurrency,
                locale,
              ),
            })}
          </p>
        </AdminSection>
      </div>

      <AdminSection title={t("admin.orders.products")}>
        <ul className="divide-y divide-border">
          {order.items.map((item) => (
            <li
              key={`${item.productId}-${item.sku ?? item.productName}`}
              className="flex gap-3 py-3 first:pt-0 last:pb-0"
            >
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- snapshot URLs vary per client
                <img
                  src={item.image}
                  alt=""
                  className="size-12 shrink-0 rounded-md object-cover bg-muted"
                />
              ) : (
                <div className="size-12 shrink-0 rounded-md bg-muted" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {item.productName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("admin.orders.itemQtyEach", {
                    quantity: item.quantity,
                    price: formatPrice(item.unitPrice, moneyCurrency, locale),
                  })}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-foreground">
                {formatPrice(
                  item.unitPrice * item.quantity,
                  moneyCurrency,
                  locale,
                )}
              </p>
            </li>
          ))}
        </ul>
      </AdminSection>

      <AdminSection title={t("admin.orders.sections.totals")}>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("admin.orders.fields.subtotal")}
            </dt>
            <dd>
              {formatPrice(order.totals.subtotal, moneyCurrency, locale)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">
              {t("admin.orders.fields.shipping")}
            </dt>
            <dd>
              {formatPrice(order.totals.shipping, moneyCurrency, locale)}
            </dd>
          </div>
          {order.totals.discount > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {t("admin.orders.fields.discount")}
              </dt>
              <dd>
                −{formatPrice(order.totals.discount, moneyCurrency, locale)}
              </dd>
            </div>
          ) : null}
          {order.totals.tax > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">
                {t("admin.orders.fields.tax")}
              </dt>
              <dd>{formatPrice(order.totals.tax, moneyCurrency, locale)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
            <dt>{t("admin.orders.fields.total")}</dt>
            <dd>{formatPrice(order.totals.total, moneyCurrency, locale)}</dd>
          </div>
        </dl>
      </AdminSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection
          title={t("admin.orders.sections.paymentInfo")}
          description={t("admin.orders.paymentInfoDescription")}
        >
          <dl className="flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("admin.orders.fields.provider")}
              </dt>
              <dd className="text-foreground">
                {providerLabel(order.payment.provider, t)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("admin.orders.fields.paymentStatus")}
              </dt>
              <dd className="mt-1">
                <PaymentStatusBadge status={order.payment.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("admin.orders.fields.transactionId")}
              </dt>
              <dd className="font-mono text-foreground">
                {order.payment.transactionId || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                {t("admin.orders.fields.paidAt")}
              </dt>
              <dd className="text-foreground">
                {formatDate(order.payment.paidAt, locale)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Select
                label={t("admin.orders.updatePaymentStatus")}
                name="payment-status"
                options={getAdminPaymentStatusOptions(t)}
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(event.target.value as OrderPaymentStatus)
                }
              />
            </div>
            <Button
              type="button"
              className="admin-btn-accent"
              loading={savingPayment}
              onClick={() => void handleUpdatePayment()}
            >
              {t("admin.orders.savePayment")}
            </Button>
          </div>
        </AdminSection>

        <AdminSection
          title={t("admin.orders.sections.fulfillmentStatus")}
          description={t("admin.orders.fulfillmentDescription")}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Select
                label={t("common.status")}
                name="fulfillment-status"
                options={getOrderStatusSelectOptions(order.status, t)}
                value={fulfillmentStatus}
                onChange={(event) =>
                  setFulfillmentStatus(
                    event.target.value as OrderWritableStatus,
                  )
                }
              />
            </div>
            <Button
              type="button"
              className="admin-btn-accent"
              loading={savingStatus}
              onClick={() => void handleUpdateStatus()}
            >
              {t("admin.orders.updateStatus")}
            </Button>
          </div>
        </AdminSection>
      </div>

      <AdminSection title={t("admin.orders.orderTimeline")}>
        <OrderTimeline order={order} locale={locale} />
      </AdminSection>

      <AdminSection
        title={t("admin.orders.adminNotes")}
        description={t("admin.orders.adminNotesDescription")}
      >
        <div className="flex flex-col gap-3">
          <Textarea
            label={t("admin.orders.notesLabel")}
            name="admin-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder={t("admin.orders.notesPlaceholder")}
          />
          <div>
            <Button
              type="button"
              className="admin-btn-accent"
              loading={savingNotes}
              onClick={() => void handleSaveNotes()}
            >
              {t("admin.orders.saveNotes")}
            </Button>
          </div>
        </div>
      </AdminSection>
    </AdminPage>
  );
}
