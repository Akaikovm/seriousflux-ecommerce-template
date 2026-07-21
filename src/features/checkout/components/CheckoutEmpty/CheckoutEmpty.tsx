"use client";

import { StorefrontPrimaryLink } from "@/features/storefront/components/StorefrontPrimaryLink";
import { useT } from "@/i18n";
import { EmptyState } from "@/shared/ui/EmptyState";

/**
 * Empty / blocked checkout surfaces.
 */

export type CheckoutEmptyProps = {
  variant?: "empty-cart" | "shipping-disabled";
  className?: string;
};

export function CheckoutEmpty({
  variant = "empty-cart",
  className,
}: CheckoutEmptyProps) {
  const t = useT();

  if (variant === "shipping-disabled") {
    return (
      <div className={className}>
        <EmptyState
          title={t("checkout.shippingDisabledTitle")}
          description={t("checkout.shippingDisabledDescription")}
          action={
            <StorefrontPrimaryLink href="/cart">
              {t("checkout.backToCart")}
            </StorefrontPrimaryLink>
          }
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <EmptyState
        title={t("checkout.emptyCartTitle")}
        description={t("checkout.emptyCartDescription")}
        action={
          <StorefrontPrimaryLink href="/#featured">
            {t("checkout.continueShopping")}
          </StorefrontPrimaryLink>
        }
      />
    </div>
  );
}
