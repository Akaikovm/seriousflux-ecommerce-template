"use client";

import Link from "next/link";

import { formatAccountDate } from "@/features/account/lib";
import { AccountAvatar } from "@/features/account/components/AccountAvatar";
import { useAccountProfile } from "@/features/account/hooks/useAccountProfile";
import { useCustomerOrders } from "@/features/account/hooks/useCustomerOrders";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { useT } from "@/i18n";
import { formatPrice } from "@/lib/format-price";
import { StorefrontPrimaryLink } from "@/features/storefront/components/StorefrontPrimaryLink";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { LoadingState } from "@/shared/ui/LoadingState";

type AccountDashboardProps = {
  locale: string;
  currency: string;
};

/**
 * Account dashboard — name, member since, order count, latest three orders.
 */
export function AccountDashboard({ locale, currency }: AccountDashboardProps) {
  const t = useT();
  const { profile, loading: profileLoading, error: profileError } =
    useAccountProfile();
  const { orders, loading: ordersLoading, error: ordersError } =
    useCustomerOrders();

  const loading = profileLoading || ordersLoading;

  if (loading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <LoadingState height="5rem" />
        <LoadingState height="8rem" />
        <LoadingState height="10rem" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <EmptyState
        title={t("account.loadFailedTitle")}
        description={profileError ?? t("account.loadFailedDescription")}
      />
    );
  }

  const recentOrders = orders.slice(0, 3);
  const latestOrder = orders[0] ?? null;
  const displayName =
    profile.displayName.trim() || profile.email || t("account.customerFallback");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <AccountAvatar
          photoURL={profile.photoURL}
          displayName={displayName}
          size="lg"
        />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="storefront-heading text-[clamp(1.75rem,3vw,2.25rem)] text-foreground">
            {t("account.dashboardWelcomeNamed", { name: displayName })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("account.memberSince", {
              date: formatAccountDate(profile.createdAt, locale),
            })}
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card padding="md">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {t("account.totalOrders")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {orders.length}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {t("account.latestOrderStatus")}
          </p>
          <div className="mt-3">
            {latestOrder ? (
              <OrderStatusBadge status={latestOrder.status} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("account.noOrdersTitle")}
              </p>
            )}
          </div>
        </Card>
      </div>

      {ordersError ? (
        <p className="text-sm text-destructive" role="alert">
          {ordersError}
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t("account.recentOrders")}
          </h2>
          {orders.length > 0 ? (
            <Link
              href="/account/orders"
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              {t("common.viewAll")}
            </Link>
          ) : null}
        </div>

        {recentOrders.length === 0 ? (
          <EmptyState
            title={t("account.noOrdersTitle")}
            description={t("account.noOrdersDescription")}
            action={
              <StorefrontPrimaryLink href="/#featured">
                {t("cart.continueShopping")}
              </StorefrontPrimaryLink>
            }
          />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex flex-col gap-2 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatAccountDate(order.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
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
      </section>
    </div>
  );
}
