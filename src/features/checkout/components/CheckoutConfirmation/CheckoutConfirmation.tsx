import { BrandLockup } from "@/features/storefront/components/BrandLockup";
import { StorefrontPrimaryLink } from "@/features/storefront/components/StorefrontPrimaryLink";
import { EmptyState } from "@/shared/ui/EmptyState";
import { radius } from "@/shared/design/tokens";

/**
 * Post-checkout confirmation (RFC-013).
 *
 * URL: `/checkout/confirmation?order=<orderId>&ref=<orderNumber>`
 * Never shows the raw Firestore document id in the UI.
 */

export type CheckoutConfirmationProps = {
  /** Present when the URL includes `?order=` (technical id). */
  orderId: string | null;
  /** Human-friendly order number from `?ref=` when available. */
  orderNumber: string | null;
  storeName: string;
  logo?: string;
};

export function CheckoutConfirmation({
  orderId,
  orderNumber,
  storeName,
  logo = "",
}: CheckoutConfirmationProps) {
  if (!orderId) {
    return (
      <EmptyState
        title="Order not found"
        description="We could not find a confirmation for this visit. If you just placed an order, check your email or return to the store."
        action={
          <StorefrontPrimaryLink href="/">Back to store</StorefrontPrimaryLink>
        }
      />
    );
  }

  return (
    <div className="relative mx-auto max-w-lg overflow-hidden px-2 py-6 text-center sm:py-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        style={{
          backgroundImage: `
            radial-gradient(
              ellipse 70% 50% at 50% 0%,
              color-mix(in oklab, var(--brand-accent) 16%, transparent),
              transparent 65%
            )
          `,
        }}
        aria-hidden
      />

      <div className="storefront-rise mb-8 flex justify-center">
        <BrandLockup storeName={storeName} logo={logo} size="nav" />
      </div>

      <h1 className="storefront-heading storefront-rise storefront-rise-delay-1 text-[clamp(1.75rem,4vw,2.5rem)] text-foreground text-balance">
        Thank you for your order
      </h1>
      <p className="storefront-rise storefront-rise-delay-2 mt-4 text-base text-muted-foreground">
        {storeName} has received your order. We will follow up with next steps
        for payment and fulfillment.
      </p>

      {orderNumber ? (
        <div
          className="storefront-rise storefront-rise-delay-3 mx-auto mt-8 border border-border/70 bg-background/80 px-6 py-5"
          style={{ borderRadius: radius.xl }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Order number
          </p>
          <p className="storefront-heading mt-2 text-xl tracking-wide text-foreground">
            {orderNumber}
          </p>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Keep an eye on your inbox for confirmation details.
        </p>
      )}

      <div className="mt-10">
        <StorefrontPrimaryLink href="/#featured">
          Continue shopping
        </StorefrontPrimaryLink>
      </div>
    </div>
  );
}
