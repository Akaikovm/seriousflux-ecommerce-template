import type { Product } from "@/features/products/types";
import { cn } from "@/lib/utils";
import { typography } from "@/shared/design/tokens";

import { ProductImage } from "./ProductImage";
import { ProductInfo } from "./ProductInfo";

/**
 * Product detail composition.
 *
 * Assembles image + info for a single product. Data is provided by the
 * route page via ProductService — this component never fetches.
 *
 * Reserved visual zones for future variants, reviews, and recommendations.
 */

export type ProductDetailProps = {
  product: Product;
  /** BCP 47 locale from StoreSettings for price formatting. */
  locale: string;
  /** ISO 4217 store currency from StoreSettings (product fallback). */
  currency: string;
  /** Resolved category display name (optional; page may omit on lookup failure). */
  categoryName?: string;
  /** When set with categoryName, links the category label. */
  categoryHref?: string;
  className?: string;
};

export function ProductDetail({
  product,
  locale,
  currency,
  categoryName,
  categoryHref,
  className,
}: ProductDetailProps) {
  return (
    <div className={cn("flex flex-col gap-16", className)}>
      <article
        className="grid gap-10 md:grid-cols-2 md:items-start md:gap-14 lg:gap-16"
        data-product-slug={product.slug}
      >
        <ProductImage src={product.image} alt={product.name} />
        <ProductInfo
          productId={product.id}
          name={product.name}
          slug={product.slug}
          image={product.image}
          description={product.description}
          price={product.price}
          currency={product.currency || currency}
          locale={locale}
          categoryName={categoryName}
          categoryHref={categoryHref}
        />
      </article>

      {/* Future: related products / recommendations */}
      <aside
        className="hidden border-t border-border pt-12"
        aria-hidden
        data-product-recommendations
      >
        <p
          className="text-muted-foreground"
          style={{ fontSize: typography.fontSize.sm }}
        >
          Recommendations
        </p>
      </aside>
    </div>
  );
}
