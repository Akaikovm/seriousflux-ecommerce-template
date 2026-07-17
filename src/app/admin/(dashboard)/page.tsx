import type { Metadata } from "next";

import { DashboardOverview } from "@/features/admin/dashboard";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getProductCount(): Promise<number> {
  try {
    return await new ProductService().countAll();
  } catch (error) {
    if (error instanceof ProductError) {
      console.error(`[ProductService] ${error.code}: ${error.message}`);
    } else {
      console.error("[ProductService] Unexpected error counting products", error);
    }
    return 0;
  }
}

async function getCategoryCount(): Promise<number> {
  try {
    return await new CategoryService().countAll();
  } catch (error) {
    if (error instanceof CategoryError) {
      console.error(`[CategoryService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[CategoryService] Unexpected error counting categories",
        error,
      );
    }
    return 0;
  }
}

/**
 * Admin dashboard — `/admin`.
 */
export default async function AdminDashboardPage() {
  const [settings, productCount, categoryCount] = await Promise.all([
    getStoreSettings(),
    getProductCount(),
    getCategoryCount(),
  ]);

  return (
    <DashboardOverview
      productCount={productCount}
      categoryCount={categoryCount}
      storeName={settings.storeName}
      maintenanceMode={settings.maintenanceMode}
    />
  );
}
