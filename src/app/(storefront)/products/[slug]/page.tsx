import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import {
  InventoryError,
  InventoryService,
} from "@/features/inventory/services";
import { resolveStorefrontAvailability } from "@/features/inventory/lib";
import { ProductDetail } from "@/features/products/components/ProductDetail";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import type { Product } from "@/features/products/types";
import { DEFAULT_INVENTORY_SETTINGS } from "@/features/settings/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { StorefrontBreadcrumb } from "@/features/storefront/components/StorefrontBreadcrumb";
import { createT, getDictionary, resolveLanguage } from "@/i18n";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    return await new ProductService().getBySlug(slug);
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
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getStoreSettings(),
  ]);
  const t = createT(getDictionary(resolveLanguage(settings.language)));

  if (!product) {
    return {
      title: t("products.notFoundTitle"),
      description: t("products.notFoundDescription"),
    };
  }
  return {
    title: product.name,
    description: product.description,
  };
}

/**
 * Product detail route — `/products/[slug]` (RFC-023 inventory UX).
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getStoreSettings(),
  ]);

  if (!product || !product.active) {
    notFound();
  }

  const t = createT(getDictionary(resolveLanguage(settings.language)));
  const inventorySettings = settings.inventory ?? DEFAULT_INVENTORY_SETTINGS;
  let quantity = 0;
  try {
    const inventory = await new InventoryService().getInventory(product.id);
    quantity = inventory?.quantity ?? 0;
  } catch (error) {
    if (error instanceof InventoryError) {
      console.error(`[InventoryService] ${error.code}: ${error.message}`);
    }
  }

  if (
    product.trackInventory &&
    quantity <= 0 &&
    !product.allowBackorders &&
    product.visibilityWhenOutOfStock === "hidden"
  ) {
    notFound();
  }

  const availability = resolveStorefrontAvailability({
    product,
    quantity,
    inventorySettings,
    t,
  });

  const category = await getProductCategory(product.categoryId);
  const breadcrumbItems = [
    { label: t("nav.home"), href: "/" },
    ...(category
      ? [{ label: category.name, href: category.href }]
      : [{ label: t("nav.shop"), href: "/#featured" }]),
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
          availability={availability}
        />
      </div>
    </section>
  );
}
