"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable } from "@/features/admin/components/DataTable";
import type { AdminProductRow } from "@/features/admin/products/admin-product-row";
import { StockStatusBadge } from "@/features/admin/products/StockStatusBadge";
import type { AdminDataTableColumn } from "@/features/admin/types";
import {
  AdminList,
  AdminPage,
  AdminPageHeader,
  AdminRowActions,
  AdminTableToolbar,
} from "@/features/admin/ui";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import { useT } from "@/i18n";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { useToast } from "@/shared/ui/Toast";

type StockFilter = "all" | "tracked" | "not_tracked" | "low_stock" | "out_of_stock";

type AdminProductsTableProps = {
  products: AdminProductRow[];
  categoryNames: Record<string, string>;
  locale: string;
  currency: string;
};

function formatPrice(
  price: number,
  locale: string,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

/**
 * Admin products list with inventory column and filters (ADR-021 / RFC-023).
 */
export function AdminProductsTable({
  products,
  categoryNames,
  locale,
  currency,
}: AdminProductsTableProps) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<AdminProductRow | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      if (stockFilter === "tracked" && !product.trackInventory) {
        return false;
      }
      if (stockFilter === "not_tracked" && product.trackInventory) {
        return false;
      }
      if (stockFilter === "low_stock" && product.inventoryStatus !== "low_stock") {
        return false;
      }
      if (
        stockFilter === "out_of_stock" &&
        product.inventoryStatus !== "out_of_stock"
      ) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        (product.sku?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [products, search, stockFilter]);

  async function handleDelete() {
    if (!pendingDelete || deleting) {
      return;
    }

    setDeleting(true);
    try {
      await new ProductService().delete(pendingDelete.id);
      toast.success(t("admin.products.deleted"));
      setPendingDelete(null);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ProductError
          ? err.message
          : t("admin.products.deleteFailed");
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive(product: AdminProductRow) {
    if (togglingId) {
      return;
    }

    setTogglingId(product.id);
    try {
      await new ProductService().update(product.id, {
        active: !product.active,
      });
      toast.success(
        product.active
          ? t("admin.products.disabled")
          : t("admin.products.enabled"),
      );
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ProductError
          ? err.message
          : t("admin.products.updateFailed");
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  }

  const columns: AdminDataTableColumn<AdminProductRow>[] = [
    {
      id: "image",
      header: t("admin.products.columns.image"),
      className: "w-14",
      cell: (product) =>
        product.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client; next/image domains are not fixed yet
          <img
            src={product.image}
            alt=""
            className="admin-table__thumb"
          />
        ) : (
          <span className="admin-table__thumb admin-table__thumb--empty" aria-hidden />
        ),
    },
    {
      id: "name",
      header: t("admin.products.columns.name"),
      cell: (product) => (
        <div className="admin-table__entity">
          <span className="admin-table__entity-title">{product.name}</span>
          <span className="admin-table__entity-meta">{product.slug}</span>
        </div>
      ),
    },
    {
      id: "price",
      header: t("admin.products.columns.price"),
      cell: (product) =>
        formatPrice(product.price, locale, product.currency || currency),
    },
    {
      id: "stock",
      header: t("admin.products.columns.stock"),
      cell: (product) =>
        product.trackInventory ? (
          <span className="tabular-nums">{product.stockQuantity ?? 0}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "inventory",
      header: t("admin.products.columns.inventory"),
      cell: (product) => <StockStatusBadge status={product.inventoryStatus} />,
    },
    {
      id: "category",
      header: t("admin.products.columns.category"),
      cell: (product) =>
        categoryNames[product.categoryId] || product.categoryId || "—",
    },
    {
      id: "status",
      header: t("admin.products.columns.status"),
      cell: (product) => (
        <Badge variant={product.active ? "primary" : "secondary"}>
          {product.active ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: t("admin.products.columns.actions"),
      className: "text-right",
      cell: (product) => (
        <AdminRowActions>
          <Button
            type="button"
            className="admin-action-btn admin-btn-ghost"
            loading={togglingId === product.id}
            onClick={() => void handleToggleActive(product)}
          >
            {product.active ? t("common.disable") : t("common.enable")}
          </Button>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="inline-flex"
          >
            <Button type="button" className="admin-action-btn admin-btn-ghost">
              {t("common.edit")}
            </Button>
          </Link>
          <Button
            type="button"
            className="admin-action-btn bg-destructive text-white hover:bg-destructive/90"
            onClick={() => setPendingDelete(product)}
          >
            {t("common.delete")}
          </Button>
        </AdminRowActions>
      ),
    },
  ];

  return (
    <AdminPage list>
      <AdminPageHeader
        eyebrow={t("admin.products.eyebrow")}
        title={t("admin.products.title")}
        description={t("admin.products.description")}
        actions={
          <Link href="/admin/products/new" className="block sm:inline-flex">
            <Button type="button" className="admin-btn-accent w-full sm:w-auto">
              {t("admin.products.create")}
            </Button>
          </Link>
        }
      />

      <AdminList>
        <AdminTableToolbar>
          <Input
            name="product-search"
            label={t("common.search")}
            value={search}
            placeholder={t("admin.products.searchPlaceholder")}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            name="stock-filter"
            label={t("admin.products.columns.inventory")}
            value={stockFilter}
            options={[
              { value: "all", label: t("admin.products.filter.stockAll") },
              { value: "tracked", label: t("admin.products.filter.stockTracked") },
              {
                value: "not_tracked",
                label: t("admin.products.filter.stockNotTracked"),
              },
              { value: "low_stock", label: t("inventory.status.low_stock") },
              {
                value: "out_of_stock",
                label: t("inventory.status.out_of_stock"),
              },
            ]}
            onChange={(event) =>
              setStockFilter(event.target.value as StockFilter)
            }
          />
        </AdminTableToolbar>

        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(product) => product.id}
          emptyTitle={t("admin.products.emptyTitle")}
          emptyDescription={t("admin.products.emptyDescription")}
          emptyAction={
            <Link href="/admin/products/new">
              <Button type="button" className="admin-btn-accent">
                {t("admin.products.create")}
              </Button>
            </Link>
          }
          footer={t("admin.products.footerCount", { count: filtered.length })}
        />
      </AdminList>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("admin.products.deleteTitle")}
        description={
          pendingDelete ? t("admin.products.deleteDescription") : undefined
        }
        confirmLabel={t("admin.common.confirmDelete")}
        cancelLabel={t("admin.common.cancel")}
        loading={deleting}
        destructive
        onCancel={() => {
          if (!deleting) {
            setPendingDelete(null);
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </AdminPage>
  );
}
