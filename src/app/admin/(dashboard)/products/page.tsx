import type { Metadata } from "next";

import { AdminProductsTable } from "@/features/admin/products";
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

export const metadata: Metadata = {
  title: "Products",
};

async function getProducts(): Promise<Product[]> {
  try {
    return await new ProductService().listAll();
  } catch (error) {
    if (error instanceof ProductError) {
      console.error(`[ProductService] ${error.code}: ${error.message}`);
    } else {
      console.error("[ProductService] Unexpected error listing products", error);
    }
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    return await new CategoryService().listAll();
  } catch (error) {
    if (error instanceof CategoryError) {
      console.error(`[CategoryService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[CategoryService] Unexpected error listing categories",
        error,
      );
    }
    return [];
  }
}

/**
 * Admin products — `/admin/products`.
 */
export default async function AdminProductsPage() {
  const [settings, products, categories] = await Promise.all([
    getStoreSettings(),
    getProducts(),
    getCategories(),
  ]);

  const categoryNames = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <AdminProductsTable
      products={products}
      categoryNames={categoryNames}
      locale={settings.locale}
      currency={settings.currency}
    />
  );
}
