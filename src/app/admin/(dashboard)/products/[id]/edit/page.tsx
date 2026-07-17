import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/features/admin/products";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import type { Category } from "@/features/categories/types";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Edit product",
};

type AdminEditProductPageProps = {
  params: Promise<{ id: string }>;
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
 * Admin edit product — `/admin/products/[id]/edit`.
 */
export default async function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  const { id } = await params;

  const [settings, categories, productResult] = await Promise.all([
    getStoreSettings(),
    getCategories(),
    (async () => {
      try {
        return await new ProductService().getById(id);
      } catch (error) {
        if (error instanceof ProductError) {
          console.error(`[ProductService] ${error.code}: ${error.message}`);
        } else {
          console.error(
            "[ProductService] Unexpected error loading product",
            error,
          );
        }
        return null;
      }
    })(),
  ]);

  if (!productResult) {
    notFound();
  }

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
        mode="edit"
        product={productResult}
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
        }))}
        defaultCurrency={settings.currency}
      />
    </div>
  );
}
