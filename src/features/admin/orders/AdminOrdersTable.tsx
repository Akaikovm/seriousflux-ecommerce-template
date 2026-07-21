"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminOrderView } from "@/features/admin/orders/admin-order-view";
import { DataTable } from "@/features/admin/components/DataTable";
import type { AdminDataTableColumn } from "@/features/admin/types";
import {
  AdminPage,
  AdminPageHeader,
  AdminRowActions,
  AdminTableToolbar,
} from "@/features/admin/ui";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/features/orders/components/PaymentStatusBadge";
import {
  getOrderStatusFilterOptions,
  normalizeOrderStatus,
  type OrderCanonicalStatus,
} from "@/features/orders/lib/order-status";
import { useT } from "@/i18n";
import { formatPrice } from "@/lib/format-price";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

type AdminOrdersTableProps = {
  orders: AdminOrderView[];
  locale: string;
  currency: string;
};

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function matchesSearch(order: AdminOrderView, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }

  return (
    order.orderNumber.toLowerCase().includes(q) ||
    order.customerName.toLowerCase().includes(q) ||
    order.customerEmail.toLowerCase().includes(q)
  );
}

/**
 * Admin orders list (RFC-014).
 * Client-side search (number / name / email) and status filter.
 * DataTable remains presentational.
 */
export function AdminOrdersTable({
  orders,
  locale,
  currency,
}: AdminOrdersTableProps) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      if (!matchesSearch(order, search)) {
        return false;
      }
      if (!statusFilter) {
        return true;
      }
      return (
        normalizeOrderStatus(order.status) ===
        (statusFilter as OrderCanonicalStatus)
      );
    });
  }, [orders, search, statusFilter]);

  const statusOptions = [
    { value: "", label: t("admin.orders.allStatuses") },
    ...getOrderStatusFilterOptions(t).map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  const columns: AdminDataTableColumn<AdminOrderView>[] = [
    {
      id: "orderNumber",
      header: t("admin.orders.columns.order"),
      cell: (order) => (
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {order.orderNumber}
        </Link>
      ),
    },
    {
      id: "customer",
      header: t("admin.orders.columns.customer"),
      cell: (order) => (
        <div>
          <p className="font-medium text-foreground">{order.customerName}</p>
          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      id: "date",
      header: t("admin.orders.columns.date"),
      cell: (order) => (
        <span className="text-muted-foreground">
          {formatDate(order.createdAt, locale)}
        </span>
      ),
    },
    {
      id: "total",
      header: t("admin.orders.columns.total"),
      cell: (order) =>
        formatPrice(order.totals.total, order.currency || currency, locale),
    },
    {
      id: "payment",
      header: t("admin.orders.columns.payment"),
      cell: (order) => <PaymentStatusBadge status={order.payment.status} />,
    },
    {
      id: "fulfillment",
      header: t("admin.orders.columns.fulfillment"),
      cell: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      id: "actions",
      header: t("common.actions"),
      className: "text-right",
      cell: (order) => (
        <AdminRowActions>
          <Link href={`/admin/orders/${order.id}`} className="inline-flex">
            <Button type="button" className="admin-action-btn admin-btn-ghost">
              {t("admin.common.view")}
            </Button>
          </Link>
        </AdminRowActions>
      ),
    },
  ];

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow={t("admin.orders.eyebrow")}
        title={t("admin.orders.title")}
        description={t("admin.orders.description")}
      />

      <AdminTableToolbar>
        <Input
          label={t("common.search")}
          name="order-search"
          placeholder={t("admin.orders.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label={t("admin.orders.fulfillmentStatusFilter")}
          name="order-status-filter"
          options={statusOptions}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
      </AdminTableToolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowId={(order) => order.id}
        emptyTitle={t("admin.orders.emptyTitle")}
        emptyDescription={
          orders.length === 0
            ? t("admin.orders.emptyDescription")
            : t("admin.orders.emptyFilteredDescription")
        }
        footer={
          filtered.length === 1
            ? t("admin.orders.footerCount", { count: filtered.length })
            : t("admin.orders.footerCountPlural", { count: filtered.length })
        }
      />
    </AdminPage>
  );
}
