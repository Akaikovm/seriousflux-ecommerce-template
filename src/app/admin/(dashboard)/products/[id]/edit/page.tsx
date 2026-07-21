import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/features/admin/products";
import {
  adminGetInventory,
  adminGetProductById,
  adminListCategories,
} from "@/features/admin/lib/admin-server-data";
import { CategoryError } from "@/features/categories/services";
import type { Category } from "@/features/categories/types";
import { InventoryError } from "@/features/inventory/services";
import { ProductError } from "@/features/products/services";
import {
  DEFAULT_INVENTORY_SETTINGS,
} from "@/features/settings/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Edit product",
};

type AdminEditProductPageProps = {
  params: Promise<{ id: string }>;
};

async function getCategories(): Promise<Category[]> {
  try {
    return await adminListCategories();
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
        return await adminGetProductById(id);
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

  let initialStockQuantity = 0;
  try {
    const inventory = await adminGetInventory(id);
    initialStockQuantity = inventory?.quantity ?? 0;
  } catch (error) {
    if (error instanceof InventoryError) {
      console.error(`[InventoryService] ${error.code}: ${error.message}`);
    }
  }

  const inventoryDefaults = settings.inventory ?? DEFAULT_INVENTORY_SETTINGS;

  return (
    <ProductForm
      mode="edit"
      product={productResult}
      initialStockQuantity={initialStockQuantity}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
      }))}
      defaultCurrency={settings.currency}
      inventoryDefaults={{
        trackInventory: inventoryDefaults.defaultTrackInventory,
        lowStockThreshold: inventoryDefaults.defaultLowStockThreshold,
        allowBackorders: inventoryDefaults.defaultAllowBackorders,
      }}
    />
  );
}
