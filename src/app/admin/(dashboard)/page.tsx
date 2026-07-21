import type { Metadata } from "next";

import { DashboardOverview } from "@/features/admin/dashboard";
import {
  adminCountCategories,
  adminCountProducts,
  adminGetInventoryByProductIds,
  adminListProducts,
} from "@/features/admin/lib/admin-server-data";
import { CategoryError } from "@/features/categories/services";
import { InventoryError } from "@/features/inventory/services";
import { resolveInventoryStatus } from "@/features/inventory/lib/stock-status";
import { ProductError } from "@/features/products/services";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getProductCount(): Promise<number> {
  try {
    return await adminCountProducts();
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
    return await adminCountCategories();
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

async function getInventoryWidgetCounts(): Promise<{
  lowStockCount: number;
  outOfStockCount: number;
}> {
  try {
    const products = await adminListProducts();
    const tracked = products.filter((product) => product.trackInventory);
    if (tracked.length === 0) {
      return { lowStockCount: 0, outOfStockCount: 0 };
    }

    const inventoryMap = await adminGetInventoryByProductIds(
      tracked.map((product) => product.id),
    );

    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const product of tracked) {
      const quantity = inventoryMap.get(product.id)?.quantity ?? 0;
      const status = resolveInventoryStatus({
        trackInventory: true,
        quantity,
        lowStockThreshold: product.lowStockThreshold,
      });
      if (status === "low_stock") {
        lowStockCount += 1;
      }
      if (status === "out_of_stock") {
        outOfStockCount += 1;
      }
    }

    return { lowStockCount, outOfStockCount };
  } catch (error) {
    if (error instanceof InventoryError || error instanceof ProductError) {
      console.error(`[Dashboard inventory] ${error.message}`);
    } else {
      console.error("[Dashboard inventory] Unexpected error", error);
    }
    return { lowStockCount: 0, outOfStockCount: 0 };
  }
}

/**
 * Admin dashboard — `/admin`.
 */
export default async function AdminDashboardPage() {
  const [settings, productCount, categoryCount, inventoryCounts] =
    await Promise.all([
      getStoreSettings(),
      getProductCount(),
      getCategoryCount(),
      getInventoryWidgetCounts(),
    ]);

  return (
    <DashboardOverview
      productCount={productCount}
      categoryCount={categoryCount}
      lowStockCount={inventoryCounts.lowStockCount}
      outOfStockCount={inventoryCounts.outOfStockCount}
      storeName={settings.storeName}
      maintenanceMode={settings.maintenanceMode}
      language={settings.language}
    />
  );
}
