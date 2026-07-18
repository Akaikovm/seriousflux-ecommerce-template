"use client";

import Link from "next/link";

import {
  formatAccountDateTime,
  providerLabel,
} from "@/features/account/lib";
import { useCustomerOrder } from "@/features/account/hooks/useCustomerOrderDetail";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/features/orders/components/PaymentStatusBadge";
import { formatPrice } from "@/lib/format-price";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { LoadingState } from "@/shared/ui/LoadingState";

type AccountOrderDetailProps = {
  orderId: string;
  locale: string;
  currency: string;
};

/**
 * Read-only customer order detail. Never shows admin notes or Firestore ids.
 */
export function AccountOrderDetail({
  orderId,
  locale,
  currency,
}: AccountOrderDetailProps) {
  const { order, loading, error, notFound } = useCustomerOrder(orderId);

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <LoadingState height="4rem" />
        <LoadingState height="10rem" />
        <LoadingState height="8rem" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order does not exist or does not belong to your account."
        action={
          <Link
            href="/account/orders"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Back to orders
          </Link>
        }
      />
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load order" description={error} />
    );
  }

  const moneyCurrency = order.currency || currency;
  const address = order.shippingAddress;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/account/orders"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Orders
        </Link>
        <h1 className="storefront-heading text-[clamp(1.75rem,3vw,2.25rem)] text-foreground">
          {order.orderNumber}
        </h1>
        <p className="text-sm text-muted-foreground">
          Placed {formatAccountDateTime(order.createdAt, locale)}
        </p>
      </header>

      <Card padding="md">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-1">
              <OrderStatusBadge status={order.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Payment</dt>
            <dd className="mt-1 flex flex-col gap-1">
              <PaymentStatusBadge status={order.payment.status} />
              <span className="text-xs text-muted-foreground">
                {providerLabel(order.payment.provider)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Total</dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {formatPrice(order.totals.total, moneyCurrency, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Shipping</dt>
            <dd className="mt-1 text-sm text-foreground">
              {order.shippingMethod.label}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="md">
          <h2 className="text-sm font-semibold text-foreground">Shipping</h2>
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
        </Card>

        <Card padding="md">
          <h2 className="text-sm font-semibold text-foreground">Totals</h2>
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
                  −
                  {formatPrice(order.totals.discount, moneyCurrency, locale)}
                </dd>
              </div>
            ) : null}
            {order.totals.tax > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tax</dt>
                <dd>
                  {formatPrice(order.totals.tax, moneyCurrency, locale)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
              <dt>Total</dt>
              <dd>
                {formatPrice(order.totals.total, moneyCurrency, locale)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card padding="md">
        <h2 className="text-sm font-semibold text-foreground">Items</h2>
        <ul className="mt-4 divide-y divide-border">
          {order.items.map((item) => (
            <li
              key={`${item.productId}-${item.sku ?? item.productName}-${item.selectedSize ?? ""}-${item.selectedColor ?? ""}`}
              className="flex gap-4 py-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt=""
                className="size-16 shrink-0 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{item.productName}</p>
                <p className="text-sm text-muted-foreground">
                  Qty {item.quantity}
                  {item.selectedSize ? ` · ${item.selectedSize}` : ""}
                  {item.selectedColor ? ` · ${item.selectedColor}` : ""}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground">
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
    </div>
  );
}
