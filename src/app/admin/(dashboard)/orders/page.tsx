import type { Metadata } from "next";

import {
  AdminOrdersTable,
  toAdminOrderView,
} from "@/features/admin/orders";
import { adminListOrders } from "@/features/admin/lib/admin-server-data";
import { OrderError } from "@/features/orders/services";
import type { Order } from "@/features/orders/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

export const metadata: Metadata = {
  title: "Orders",
};

async function getOrders(): Promise<Order[]> {
  try {
    return await adminListOrders();
  } catch (error) {
    if (error instanceof OrderError) {
      console.error(`[AdminOrderService] ${error.code}: ${error.message}`);
    } else {
      console.error("[AdminOrderService] Unexpected error listing orders", error);
    }
    return [];
  }
}

/**
 * Admin orders — `/admin/orders`.
 */
export default async function AdminOrdersPage() {
  const [settings, orders] = await Promise.all([
    getStoreSettings(),
    getOrders(),
  ]);

  return (
    <AdminOrdersTable
      orders={orders.map(toAdminOrderView)}
      locale={settings.locale}
      currency={settings.currency}
    />
  );
}
