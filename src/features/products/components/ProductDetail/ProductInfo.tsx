import Link from "next/link";

import { AddToCartButton } from "@/features/cart/components/AddToCartButton";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { spacing, typography } from "@/shared/design/tokens";

/**
 * Product text block for the detail page: name, description, price,
 * category label, and Add to Cart (RFC-009).
 *
 * Reserved space for future variants and reviews — not implemented.
 */

export type ProductInfoProps = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  price: number;
  currency: string;
  /** BCP 47 locale from StoreSettings. */
  locale: string;
  /** Human-readable category name when resolved by the page. */
  categoryName?: string;
  /** When set with categoryName, the label links to the category page. */
  categoryHref?: string;
  shippingEnabled?: boolean;
  storeName?: string;
  className?: string;
};

export function ProductInfo({
  productId,
  name,
  slug,
  image,
  description,
  price,
  currency,
  locale,
  categoryName,
  categoryHref,
  shippingEnabled = false,
  storeName = "",
  className,
}: ProductInfoProps) {
  const formattedPrice = formatPrice(price, currency, locale);
  const categoryLabel = categoryName?.trim() ?? "";

  return (
    <div
      className={cn("flex flex-col", className)}
      style={{ gap: spacing["2xl"] }}
    >
      <div className="space-y-4">
        {categoryLabel.length > 0 ? (
          categoryHref ? (
            <Link
              href={categoryHref}
              className="inline-block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-brand-accent"
            >
              {categoryLabel}
            </Link>
          ) : (
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {categoryLabel}
            </p>
          )
        ) : null}

        <h1 className="storefront-heading text-[clamp(1.75rem,4vw,2.75rem)] text-balance text-foreground">
          {name}
        </h1>

        <p
          className="text-foreground"
          style={{
            fontSize: typography.fontSize["2xl"],
            fontWeight: typography.fontWeight.semibold,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          {formattedPrice}
        </p>

        {description.trim().length > 0 ? (
          <p
            className="max-w-prose text-muted-foreground"
            style={{
              fontSize: typography.fontSize.base,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>

      {/* Future: variant selectors (size / color / etc.) */}
      <div className="hidden" aria-hidden data-product-variants />

      <div className="space-y-4 border-t border-border/70 pt-6">
        <AddToCartButton
          productId={productId}
          name={name}
          slug={slug}
          image={image}
          price={price}
          currency={currency}
          className="w-full sm:w-auto sm:min-w-[14rem]"
        />

        <p className="text-sm text-muted-foreground">
          {shippingEnabled
            ? "Shipping available at checkout."
            : storeName.trim()
              ? `${storeName} will confirm fulfillment after your order.`
              : "Fulfillment details are confirmed after your order."}
        </p>
      </div>

      {/* Future: reviews summary */}
      <div className="hidden" aria-hidden data-product-reviews />
    </div>
  );
}
