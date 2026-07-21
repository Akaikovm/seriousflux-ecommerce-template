"use client";

import { StorefrontPrimaryLink } from "@/features/storefront/components/StorefrontPrimaryLink";
import { useT } from "@/i18n";
import { EmptyState } from "@/shared/ui/EmptyState";

/**
 * Empty cart surface — composes Design System EmptyState (ADR-001).
 *
 * Presentational. CTA links back to the storefront home.
 */

export type CartEmptyProps = {
  className?: string;
};

export function CartEmpty({ className }: CartEmptyProps) {
  const t = useT();

  return (
    <div className={className}>
      <EmptyState
        title={t("cart.emptyTitle")}
        description={t("cart.emptyDescription")}
        action={
          <StorefrontPrimaryLink href="/#featured">
            {t("cart.continueShopping")}
          </StorefrontPrimaryLink>
        }
      />
    </div>
  );
}
