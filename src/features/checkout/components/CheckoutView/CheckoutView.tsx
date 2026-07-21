"use client";

import { useState } from "react";

import {
  selectCartSubtotal,
  useCartStore,
} from "@/features/cart/store";
import { useCartHydrated } from "@/features/cart/hooks/use-cart-hydrated";
import { CheckoutAuthPrompt } from "@/features/checkout/components/CheckoutAuthPrompt";
import { CheckoutEmpty } from "@/features/checkout/components/CheckoutEmpty";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import { CheckoutSummary } from "@/features/checkout/components/CheckoutSummary";
import { STANDARD_SHIPPING_METHOD } from "@/features/checkout/lib/shipping-methods";
import type { CheckoutSettingsProps } from "@/features/checkout/types";
import { StorefrontPageHeader } from "@/features/storefront/components/StorefrontPageHeader";
import { useT } from "@/i18n";
import { LoadingState } from "@/shared/ui/LoadingState";

/**
 * Client checkout composition — wires CartStore to form + summary.
 * Clears the cart only via the form's success callback after Order create.
 */

export type CheckoutViewProps = CheckoutSettingsProps;

export function CheckoutView({
  currency,
  locale,
  country,
  shippingEnabled,
  paymentOptions,
}: CheckoutViewProps) {
  const t = useT();
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const clearCart = useCartStore((state) => state.clearCart);
  /** True after a successful place-order — avoid flashing empty-cart before redirect. */
  const [isCompleting, setIsCompleting] = useState(false);

  function handleOrderCreated() {
    setIsCompleting(true);
    clearCart();
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <LoadingState height="6rem" />
        <LoadingState height="10rem" />
        <LoadingState height="8rem" />
      </div>
    );
  }

  if (isCompleting) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-16 text-center"
        aria-busy="true"
        aria-live="polite"
      >
        <LoadingState width="12rem" height="2.75rem" />
        <LoadingState width="100%" height="6rem" />
        <p className="text-sm text-muted-foreground">
          {t("checkout.finalizing")}
        </p>
      </div>
    );
  }

  if (!shippingEnabled) {
    return <CheckoutEmpty variant="shipping-disabled" />;
  }

  if (items.length === 0) {
    return <CheckoutEmpty variant="empty-cart" />;
  }

  const summaryCurrency = items[0]?.currency || currency;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-14">
      <div>
        <StorefrontPageHeader
          title={t("checkout.title")}
          subtitle={t("checkout.subtitle")}
          meta={
            <ol className="flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-[0.12em]">
              <li className="text-muted-foreground">{t("cart.title")}</li>
              <li aria-hidden className="text-border">
                /
              </li>
              <li className="font-medium text-foreground">
                {t("checkout.title")}
              </li>
              <li aria-hidden className="text-border">
                /
              </li>
              <li className="text-muted-foreground">
                {t("checkout.confirmation")}
              </li>
            </ol>
          }
        />
        <CheckoutAuthPrompt />
        <CheckoutForm
          items={items}
          currency={summaryCurrency}
          defaultCountry={country}
          paymentOptions={paymentOptions}
          onOrderCreated={handleOrderCreated}
        />
      </div>

      <CheckoutSummary
        items={items}
        subtotal={subtotal}
        shippingCost={STANDARD_SHIPPING_METHOD.cost}
        currency={summaryCurrency}
        locale={locale}
      />
    </div>
  );
}
