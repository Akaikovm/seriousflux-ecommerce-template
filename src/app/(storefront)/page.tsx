import {
  BrandValues,
  buildDefaultBrandValues,
} from "@/features/storefront/components/BrandValues";
import { Hero } from "@/features/storefront/components/Hero";
import { Newsletter } from "@/features/storefront/components/Newsletter";
import { resolveHeroContent } from "@/features/storefront/lib/resolve-hero-content";
import { FeaturedCategories } from "@/features/home/components/FeaturedCategories";
import { FeaturedProducts } from "@/features/home/components/FeaturedProducts";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import type { Category } from "@/features/categories/types";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import type { Product } from "@/features/products/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

/**
 * Storefront homepage composition (RFC-010).
 *
 * Assembles independent section components only.
 * Featured categories and products are loaded through domain services —
 * the page never queries Firestore directly.
 */
async function getFeaturedCategories(): Promise<Category[]> {
  try {
    const service = new CategoryService();
    return await service.getFeatured();
  } catch (error) {
    if (error instanceof CategoryError) {
      console.error(`[CategoryService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[CategoryService] Unexpected error loading featured categories",
        error,
      );
    }

    return [];
  }
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const service = new ProductService();
    return await service.getFeatured();
  } catch (error) {
    if (error instanceof ProductError) {
      console.error(`[ProductService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[ProductService] Unexpected error loading featured products",
        error,
      );
    }

    return [];
  }
}

export default async function HomePage() {
  const [settings, categories, products] = await Promise.all([
    getStoreSettings(),
    getFeaturedCategories(),
    getFeaturedProducts(),
  ]);

  const hero = resolveHeroContent(settings);
  const brandValues = buildDefaultBrandValues(settings.shippingEnabled);

  return (
    <>
      <Hero {...hero} />
      <FeaturedCategories categories={categories} />
      <FeaturedProducts
        products={products}
        locale={settings.locale}
        currency={settings.currency}
      />
      <BrandValues
        subtitle={
          settings.tagline.trim() ||
          "Thoughtful shopping experiences, tailored to every brand."
        }
        items={brandValues}
      />
      <Newsletter />
    </>
  );
}
