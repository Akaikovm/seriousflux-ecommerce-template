import type { Product } from "@/features/products/types";
import { cn } from "@/lib/utils";

import { ProductImage } from "./ProductImage";
import { ProductInfo } from "./ProductInfo";

/**
 * Product detail composition.
 *
 * Assembles image + info for a single product. Data is provided by the
 * route page via ProductService — this component never fetches.
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
  /** From StoreSettings — drives reassurance copy only. */
  shippingEnabled?: boolean;
  /** From StoreSettings — optional trust line context. */
  storeName?: string;
  className?: string;
};

export function ProductDetail({
  product,
  locale,
  currency,
  categoryName,
  categoryHref,
  shippingEnabled = false,
  storeName = "",
  className,
}: ProductDetailProps) {
  return (
    <article
      className={cn(
        "grid gap-10 md:grid-cols-2 md:items-start md:gap-12 lg:gap-16",
        className,
      )}
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
        shippingEnabled={shippingEnabled}
        storeName={storeName}
      />
    </article>
  );
}
