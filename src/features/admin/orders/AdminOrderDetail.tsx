"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { AdminOrderView } from "@/features/admin/orders/admin-order-view";
import { OrderTimeline } from "@/features/admin/orders/OrderTimeline";
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
import { formatPrice } from "@/lib/format-price";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
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

function providerLabel(provider: string): string {
  switch (provider) {
    case "mercadopago":
      return "Mercado Pago";
    case "cash_on_delivery":
      return "Cash on Delivery";
    case "stripe":
      return "Stripe";
    case "paypal":
      return "PayPal";
    case "bank_transfer":
      return "Bank Transfer";
    default:
      return provider;
  }
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

  useEffect(() => {
    setFulfillmentStatus(normalizeOrderStatus(order.status));
    setPaymentStatus(order.payment.status);
    setNotes(order.notes ?? "");
  }, [order]);

  const moneyCurrency = order.currency || currency;

  async function handleUpdateStatus() {
    if (savingStatus) {
      return;
    }

    setSavingStatus(true);
    try {
      await new OrderService().updateStatus(
        order.id,
        fulfillmentStatus as OrderWritableStatus,
      );
      toast.success("Fulfillment status updated.");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof OrderError
          ? err.message
          : "Unable to update fulfillment status.";
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
      await new OrderService().updatePaymentStatus(order.id, paymentStatus);
      toast.success("Payment status updated.");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof OrderError
          ? err.message
          : "Unable to update payment status.";
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
      toast.success("Admin notes saved.");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof OrderError ? err.message : "Unable to save notes.";
      toast.error(message);
    } finally {
      setSavingNotes(false);
    }
  }

  const address = order.shippingAddress;

  return (
    <div className="flex flex-col gap-6">
      <div className="admin-page-header">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/admin/orders"
              className="underline-offset-2 hover:underline"
            >
              Orders
            </Link>
            <span aria-hidden className="mx-1.5">
              /
            </span>
            {order.orderNumber}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Order detail
          </h2>
        </div>
      </div>

      {/* Order Summary */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-foreground">Order summary</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Order number</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {order.orderNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Fulfillment</dt>
            <dd className="mt-1">
              <OrderStatusBadge status={order.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Payment</dt>
            <dd className="mt-1">
              <PaymentStatusBadge status={order.payment.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Total</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {formatPrice(order.totals.total, moneyCurrency, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Created at</dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatDate(order.createdAt, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Updated at</dt>
            <dd className="mt-1 text-sm text-foreground">
              {formatDate(order.updatedAt, locale)}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Firestore id:{" "}
          <span className="font-mono text-foreground">{order.id}</span>
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-foreground">Customer</h3>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Name</dt>
              <dd className="text-foreground">{order.customerName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="text-foreground">{order.customerEmail}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Phone</dt>
              <dd className="text-foreground">{order.customerPhone || "—"}</dd>
            </div>
          </dl>
        </Card>

        {/* Shipping address */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-foreground">
            Shipping address
          </h3>
          <address className="mt-4 text-sm not-italic text-foreground">
            <p>{address.fullName}</p>
            <p>{address.line1}</p>
            {address.line2 ? <p>{address.line2}</p> : null}
            <p>
              {address.city}, {address.state} {address.postalCode}
            </p>
            <p>{address.country}</p>
            {address.phone ? <p className="mt-2">{address.phone}</p> : null}
          </address>
          <p className="mt-4 text-sm text-muted-foreground">
            Method: {order.shippingMethod.label} (
            {formatPrice(order.shippingMethod.cost, moneyCurrency, locale)})
          </p>
        </Card>
      </div>

      {/* Products */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-foreground">Products</h3>
        <ul className="mt-4 divide-y divide-border">
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
                  Qty {item.quantity} ·{" "}
                  {formatPrice(item.unitPrice, moneyCurrency, locale)} each
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
      </Card>

      {/* Totals */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-foreground">Totals</h3>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>
              {formatPrice(order.totals.subtotal, moneyCurrency, locale)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>
              {formatPrice(order.totals.shipping, moneyCurrency, locale)}
            </dd>
          </div>
          {order.totals.discount > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Discount</dt>
              <dd>
                −{formatPrice(order.totals.discount, moneyCurrency, locale)}
              </dd>
            </div>
          ) : null}
          {order.totals.tax > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>{formatPrice(order.totals.tax, moneyCurrency, locale)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(order.totals.total, moneyCurrency, locale)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment information (reserved for Mercado Pago) */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-foreground">
            Payment information
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Provider fields will be completed during Mercado Pago integration.
          </p>
          <dl className="mt-4 flex flex-col gap-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Provider</dt>
              <dd className="text-foreground">
                {providerLabel(order.payment.provider)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Payment status</dt>
              <dd className="mt-1">
                <PaymentStatusBadge status={order.payment.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Transaction ID</dt>
              <dd className="font-mono text-foreground">
                {order.payment.transactionId || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Paid at</dt>
              <dd className="text-foreground">
                {formatDate(order.payment.paidAt, locale)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Select
                label="Update payment status"
                name="payment-status"
                options={getAdminPaymentStatusOptions()}
                value={paymentStatus}
                onChange={(event) =>
                  setPaymentStatus(event.target.value as OrderPaymentStatus)
                }
              />
            </div>
            <Button
              type="button"
              loading={savingPayment}
              onClick={() => void handleUpdatePayment()}
            >
              Save payment
            </Button>
          </div>
        </Card>

        {/* Fulfillment status */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-foreground">
            Fulfillment status
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Only allowed transitions are available. Cancellation is allowed from
            pending payment and paid.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Select
                label="Status"
                name="fulfillment-status"
                options={getOrderStatusSelectOptions(order.status)}
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
              loading={savingStatus}
              onClick={() => void handleUpdateStatus()}
            >
              Update status
            </Button>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-foreground">Order timeline</h3>
        <div className="mt-4">
          <OrderTimeline order={order} locale={locale} />
        </div>
      </Card>

      {/* Admin notes */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-foreground">Admin notes</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Internal only — not shown to customers on confirmation.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <Textarea
            label="Notes"
            name="admin-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Internal notes about this order…"
          />
          <div>
            <Button
              type="button"
              loading={savingNotes}
              onClick={() => void handleSaveNotes()}
            >
              Save notes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
