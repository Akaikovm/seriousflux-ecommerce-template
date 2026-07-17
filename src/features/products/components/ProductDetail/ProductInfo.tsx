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
              className="inline-block uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                letterSpacing: "0.06em",
              }}
            >
              {categoryLabel}
            </Link>
          ) : (
            <p
              className="uppercase tracking-wide text-muted-foreground"
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                letterSpacing: "0.06em",
              }}
            >
              {categoryLabel}
            </p>
          )
        ) : null}

        <h1
          className="tracking-tight text-foreground text-balance"
          style={{
            fontSize: typography.fontSize["3xl"],
            fontWeight: typography.fontWeight.semibold,
            lineHeight: typography.lineHeight.tight,
          }}
        >
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
      <div
        className="hidden"
        aria-hidden
        data-product-variants
      />

      <AddToCartButton
        productId={productId}
        name={name}
        slug={slug}
        image={image}
        price={price}
        currency={currency}
        className="w-full sm:w-auto sm:min-w-[12rem]"
      />

      {/* Future: reviews summary */}
      <div
        className="hidden border-t border-border pt-6"
        aria-hidden
        data-product-reviews
      />
    </div>
  );
}
