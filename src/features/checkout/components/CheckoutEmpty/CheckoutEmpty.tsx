import { StorefrontPrimaryLink } from "@/features/storefront/components/StorefrontPrimaryLink";
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
  if (variant === "shipping-disabled") {
    return (
      <div className={className}>
        <EmptyState
          title="Shipping is currently unavailable"
          description="This store is not accepting shipments right now. Please check back later or contact the store for help."
          action={
            <StorefrontPrimaryLink href="/cart">
              Back to cart
            </StorefrontPrimaryLink>
          }
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <EmptyState
        title="Your cart is empty"
        description="Add products to your cart before checking out."
        action={
          <StorefrontPrimaryLink href="/#featured">
            Continue shopping
          </StorefrontPrimaryLink>
        }
      />
    </div>
  );
}
