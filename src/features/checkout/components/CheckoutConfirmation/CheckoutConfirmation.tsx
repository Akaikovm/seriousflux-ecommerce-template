import Link from "next/link";

import { EmptyState } from "@/shared/ui/EmptyState";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

/**
 * Simple post-checkout confirmation (RFC-013).
 *
 * URL: `/checkout/confirmation?order=<orderId>&ref=<orderNumber>`
 * - `order` — Firestore document id (technical; for future payment returns)
 * - `ref` — human-friendly order number shown to the customer
 *
 * Never shows the raw Firestore document id in the UI.
 * Does not depend on Cart state.
 */

export type CheckoutConfirmationProps = {
  /** Present when the URL includes `?order=` (technical id). */
  orderId: string | null;
  /** Human-friendly order number from `?ref=` when available. */
  orderNumber: string | null;
  storeName: string;
};

export function CheckoutConfirmation({
  orderId,
  orderNumber,
  storeName,
}: CheckoutConfirmationProps) {
  if (!orderId) {
    return (
      <EmptyState
        title="Order not found"
        description="We could not find a confirmation for this visit. If you just placed an order, check your email or return to the store."
        action={
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{
              gap: spacing.sm,
              paddingBlock: spacing.sm,
              paddingInline: spacing.lg,
              borderRadius: radius.md,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              lineHeight: typography.lineHeight.tight,
              transitionProperty: "color, background-color, opacity",
              transitionDuration: transition.fast,
            }}
          >
            Back to store
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Thank you for your order
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {storeName} has received your order. Payment will be available in a
        future update — your order is saved as pending payment.
      </p>

      {orderNumber ? (
        <p className="mt-6 text-sm text-foreground">
          Order number:{" "}
          <span className="font-semibold tracking-wide">{orderNumber}</span>
        </p>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Keep an eye on your inbox for confirmation details.
        </p>
      )}

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{
            gap: spacing.sm,
            paddingBlock: spacing.sm,
            paddingInline: spacing.lg,
            borderRadius: radius.md,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            lineHeight: typography.lineHeight.tight,
            transitionProperty: "color, background-color, opacity",
            transitionDuration: transition.fast,
          }}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
