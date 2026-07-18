import { StorefrontPrimaryLink } from "@/features/storefront/components/StorefrontPrimaryLink";
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
  return (
    <div className={className}>
      <EmptyState
        title="Your cart is empty"
        description="Browse the store and add products to get started."
        action={
          <StorefrontPrimaryLink href="/#featured">
            Continue shopping
          </StorefrontPrimaryLink>
        }
      />
    </div>
  );
}
