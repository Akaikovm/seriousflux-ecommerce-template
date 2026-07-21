import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  AdminOrderDetail,
  toAdminOrderView,
} from "@/features/admin/orders";
import { adminGetOrderById } from "@/features/admin/lib/admin-server-data";
import { OrderError } from "@/features/orders/services";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: AdminOrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const order = await adminGetOrderById(id);
    if (!order) {
      return { title: "Order" };
    }
    return { title: `Order ${order.orderNumber}` };
  } catch {
    return { title: "Order" };
  }
}

/**
 * Admin order detail — `/admin/orders/[id]`.
 */
export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const settings = await getStoreSettings();

  let order = null;
  try {
    order = await adminGetOrderById(id);
  } catch (error) {
    if (error instanceof OrderError) {
      console.error(`[OrderService] ${error.code}: ${error.message}`);
    } else {
      console.error("[OrderService] Unexpected error loading order", error);
    }
  }

  if (!order) {
    notFound();
  }

  const view = toAdminOrderView(order);

  return (
    <AdminOrderDetail
      key={`${view.id}-${view.updatedAt}`}
      order={view}
      locale={settings.locale}
      currency={settings.currency}
    />
  );
}
