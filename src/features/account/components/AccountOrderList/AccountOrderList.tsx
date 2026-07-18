"use client";

import Link from "next/link";

import { formatAccountDate } from "@/features/account/lib";
import { useCustomerOrders } from "@/features/account/hooks/useCustomerOrders";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/features/orders/components/PaymentStatusBadge";
import { StorefrontPrimaryLink } from "@/features/storefront/components/StorefrontPrimaryLink";
import { formatPrice } from "@/lib/format-price";
import { EmptyState } from "@/shared/ui/EmptyState";
import { LoadingState } from "@/shared/ui/LoadingState";

type AccountOrderListProps = {
  locale: string;
  currency: string;
};

/**
 * Customer order history — shows orderNumber, never Firestore ids.
 */
export function AccountOrderList({ locale, currency }: AccountOrderListProps) {
  const { orders, loading, error } = useCustomerOrders();

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <LoadingState height="3rem" />
        <LoadingState height="3rem" />
        <LoadingState height="3rem" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="storefront-heading text-[clamp(1.75rem,3vw,2.25rem)] text-foreground">
          Orders
        </h1>
        <p className="text-sm text-muted-foreground">
          Orders placed while you were signed in.
        </p>
      </header>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Guest orders are not linked to your account. Sign in before checkout to track them here."
          action={
            <StorefrontPrimaryLink href="/#featured">
              Continue shopping
            </StorefrontPrimaryLink>
          }
        />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="flex flex-col gap-3 py-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatAccountDate(order.createdAt, locale)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.payment.status} />
                  <span className="text-sm font-medium text-foreground">
                    {formatPrice(
                      order.totals.total,
                      order.currency || currency,
                      locale,
                    )}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
