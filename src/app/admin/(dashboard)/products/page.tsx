import type { Metadata } from "next";

import { AdminProductsTable } from "@/features/admin/products";
import { toAdminProductRow } from "@/features/admin/products/admin-product-row";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import type { Category } from "@/features/categories/types";
import type { InventoryRecord } from "@/features/inventory/types";
import {
  InventoryError,
  InventoryService,
} from "@/features/inventory/services";
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

  let inventoryMap = new Map<string, InventoryRecord>();
  try {
    inventoryMap = await new InventoryService().getInventoryByProductIds(
      products.map((product) => product.id),
    );
  } catch (error) {
    if (error instanceof InventoryError) {
      console.error(`[InventoryService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[InventoryService] Unexpected error listing inventory",
        error,
      );
    }
  }

  const rows = products.map((product) =>
    toAdminProductRow(product, inventoryMap.get(product.id)?.quantity ?? null),
  );

  const categoryNames = Object.fromEntries(
    categories.map((category) => [category.id, category.name]),
  );

  return (
    <AdminProductsTable
      products={rows}
      categoryNames={categoryNames}
      locale={settings.locale}
      currency={settings.currency}
    />
  );
}
