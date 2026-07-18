import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import { ProductDetail } from "@/features/products/components/ProductDetail";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import type { Product } from "@/features/products/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { StorefrontBreadcrumb } from "@/features/storefront/components/StorefrontBreadcrumb";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Loads a product by slug for the detail page and metadata.
 * Returns `null` when missing or when ProductService fails (logged).
 */
async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const service = new ProductService();
    return await service.getBySlug(slug);
  } catch (error) {
    if (error instanceof ProductError) {
      console.error(`[ProductService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[ProductService] Unexpected error loading product by slug",
        error,
      );
    }

    return null;
  }
}

/**
 * Resolves display name + href for `product.categoryId`.
 * Failures are logged and ignored — the detail page still renders.
 */
async function getProductCategory(
  categoryId: string,
): Promise<{ name: string; href?: string } | undefined> {
  try {
    const category = await new CategoryService().getById(categoryId);

    if (!category?.name.trim()) {
      return undefined;
    }

    const canLink = category.active && category.slug.trim().length > 0;

    return {
      name: category.name,
      href: canLink ? `/categories/${category.slug}` : undefined,
    };
  } catch (error) {
    if (error instanceof CategoryError) {
      console.error(`[CategoryService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[CategoryService] Unexpected error resolving product category",
        error,
      );
    }

    return undefined;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product not found",
      description: "The requested product could not be found.",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

/**
 * Product detail route — `/products/[slug]`.
 *
 * Composition root: loads via ProductService + StoreSettings (locale/currency),
 * renders presentational ProductDetail. Never imports Firebase in UI.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getStoreSettings(),
  ]);

  if (!product) {
    notFound();
  }

  const category = await getProductCategory(product.categoryId);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    ...(category
      ? [
          {
            label: category.name,
            href: category.href,
          },
        ]
      : [{ label: "Shop", href: "/#featured" }]),
    { label: product.name },
  ];

  return (
    <section
      className="storefront-section scroll-mt-[var(--storefront-navbar-height)]"
      aria-label={product.name}
    >
      <div className="storefront-container">
        <StorefrontBreadcrumb items={breadcrumbItems} />
        <ProductDetail
          product={product}
          locale={settings.locale}
          currency={settings.currency}
          categoryName={category?.name}
          categoryHref={category?.href}
          shippingEnabled={settings.shippingEnabled}
          storeName={settings.storeName}
        />
      </div>
    </section>
  );
}
