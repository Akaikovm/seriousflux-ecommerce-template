import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  AdminCustomerDetail,
  summarizeCustomerOrders,
  toAdminCustomerView,
} from "@/features/admin/customers";
import { toAdminOrderView } from "@/features/admin/orders";
import {
  CustomerAdminError,
  CustomerAdminService,
} from "@/features/customers/services";
import { OrderError, OrderService } from "@/features/orders/services";
import type { Order } from "@/features/orders/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";

type AdminCustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

export async function generateMetadata({
  params,
}: AdminCustomerDetailPageProps): Promise<Metadata> {
  const { customerId } = await params;
  try {
    const customer = await new CustomerAdminService().getById(customerId);
    if (!customer) {
      return { title: "Customer" };
    }
    return {
      title: customer.displayName || customer.email || "Customer",
    };
  } catch {
    return { title: "Customer" };
  }
}

/**
 * Admin customer detail — `/admin/customers/[customerId]`.
 */
export default async function AdminCustomerDetailPage({
  params,
}: AdminCustomerDetailPageProps) {
  const { customerId } = await params;
  const settings = await getStoreSettings();

  let customer = null;
  try {
    customer = await new CustomerAdminService().getById(customerId);
  } catch (error) {
    if (error instanceof CustomerAdminError) {
      console.error(`[CustomerAdminService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[CustomerAdminService] Unexpected error loading customer",
        error,
      );
    }
  }

  if (!customer) {
    notFound();
  }

  let orders: Order[] = [];
  try {
    orders = await new OrderService().listByCustomerId(customer.id);
  } catch (error) {
    if (error instanceof OrderError) {
      console.error(`[OrderService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[OrderService] Unexpected error listing customer orders",
        error,
      );
    }
  }

  const view = toAdminCustomerView(customer);
  const summary = summarizeCustomerOrders(orders);

  return (
    <AdminCustomerDetail
      key={`${view.id}-${view.updatedAt}`}
      customer={view}
      orders={orders.map(toAdminOrderView)}
      summary={summary}
      locale={settings.locale}
      currency={settings.currency}
    />
  );
}
