import { BrandValues } from "@/features/storefront/components/BrandValues";
import { BrandStory } from "@/features/storefront/components/BrandStory";
import { Hero } from "@/features/storefront/components/Hero";
import { Newsletter } from "@/features/storefront/components/Newsletter";
import { buildDefaultBrandValues } from "@/features/storefront/lib/build-default-brand-values";
import { resolveHeroContent } from "@/features/storefront/lib/resolve-hero-content";
import { FeaturedCategories } from "@/features/home/components/FeaturedCategories";
import { FeaturedProducts } from "@/features/home/components/FeaturedProducts";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import { toStorefrontCategory } from "@/features/categories/lib/to-storefront-category";
import type { Category } from "@/features/categories/types";
import {
  InventoryError,
  InventoryService,
} from "@/features/inventory/services";
import { shouldShowInCatalog } from "@/features/inventory/lib";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import type { Product } from "@/features/products/types";
import { DEFAULT_INVENTORY_SETTINGS } from "@/features/settings/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { createT, getDictionary, resolveLanguage } from "@/i18n";

async function getFeaturedCategories(): Promise<Category[]> {
  try {
    return await new CategoryService().getFeatured();
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
    return await new ProductService().getFeatured();
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

  const t = createT(getDictionary(resolveLanguage(settings.language)));
  const inventorySettings = settings.inventory ?? DEFAULT_INVENTORY_SETTINGS;
  let visibleProducts = products;

  try {
    const inventoryMap = await new InventoryService().getInventoryByProductIds(
      products.map((product) => product.id),
    );
    visibleProducts = products.filter((product) =>
      shouldShowInCatalog({
        product,
        quantity: inventoryMap.get(product.id)?.quantity ?? 0,
        hideOutOfStockProducts: inventorySettings.hideOutOfStockProducts,
      }),
    );
  } catch (error) {
    if (error instanceof InventoryError) {
      console.error(`[InventoryService] ${error.code}: ${error.message}`);
    }
  }

  const hero = resolveHeroContent(settings, t);
  const brandValues = buildDefaultBrandValues(settings.shippingEnabled, t);
  const storefrontCategories = categories.map(toStorefrontCategory);

  return (
    <>
      <Hero {...hero} storeName={settings.storeName} />
      <FeaturedCategories categories={storefrontCategories} />
      <FeaturedProducts
        products={visibleProducts}
        locale={settings.locale}
        currency={settings.currency}
      />
      <BrandStory
        storeName={settings.storeName}
        logo={settings.logo}
        tagline={settings.tagline}
        description={settings.description}
      />
      <BrandValues
        subtitle={
          settings.tagline.trim() || t("brandValues.defaultSubtitle")
        }
        items={brandValues}
      />
      <Newsletter />
    </>
  );
}
