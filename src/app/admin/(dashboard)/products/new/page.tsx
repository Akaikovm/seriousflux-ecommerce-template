import type { Metadata } from "next";
import Link from "next/link";

import { ProductForm } from "@/features/admin/products";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import type { Category } from "@/features/categories/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Create product",
};

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
 * Admin create product — `/admin/products/new`.
 */
export default async function AdminCreateProductPage() {
  const [settings, categories] = await Promise.all([
    getStoreSettings(),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to products
        </Link>
      </div>
      <ProductForm
        mode="create"
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        defaultCurrency={settings.currency}
      />
    </div>
  );
}
