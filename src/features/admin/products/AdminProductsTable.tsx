"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable } from "@/features/admin/components/DataTable";
import type { AdminProductRow } from "@/features/admin/products/admin-product-row";
import { StockStatusBadge } from "@/features/admin/products/StockStatusBadge";
import type { AdminDataTableColumn } from "@/features/admin/types";
import {
  AdminPage,
  AdminPageHeader,
  AdminRowActions,
  AdminTableToolbar,
} from "@/features/admin/ui";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
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
      toast.success("Product deleted.");
      setPendingDelete(null);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ProductError ? err.message : "Unable to delete product.";
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
      toast.success(product.active ? "Product disabled." : "Product enabled.");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ProductError ? err.message : "Unable to update product.";
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  }

  const columns: AdminDataTableColumn<AdminProductRow>[] = [
    {
      id: "image",
      header: "Image",
      className: "w-16",
      cell: (product) =>
        product.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client; next/image domains are not fixed yet
          <img
            src={product.image}
            alt=""
            className="size-10 rounded-md object-cover bg-muted"
          />
        ) : (
          <div className="size-10 rounded-md bg-muted" aria-hidden />
        ),
    },
    {
      id: "name",
      header: "Name",
      cell: (product) => (
        <div>
          <p className="font-medium text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.slug}</p>
        </div>
      ),
    },
    {
      id: "price",
      header: "Price",
      cell: (product) =>
        formatPrice(product.price, locale, product.currency || currency),
    },
    {
      id: "stock",
      header: "Stock",
      cell: (product) =>
        product.trackInventory ? (
          <span className="tabular-nums">{product.stockQuantity ?? 0}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "inventory",
      header: "Inventory",
      cell: (product) => <StockStatusBadge status={product.inventoryStatus} />,
    },
    {
      id: "category",
      header: "Category",
      cell: (product) =>
        categoryNames[product.categoryId] || product.categoryId || "—",
    },
    {
      id: "status",
      header: "Status",
      cell: (product) => (
        <Badge variant={product.active ? "primary" : "secondary"}>
          {product.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      cell: (product) => (
        <AdminRowActions>
          <Button
            type="button"
            className="admin-action-btn admin-btn-ghost"
            loading={togglingId === product.id}
            onClick={() => void handleToggleActive(product)}
          >
            {product.active ? "Disable" : "Enable"}
          </Button>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="inline-flex"
          >
            <Button type="button" className="admin-action-btn admin-btn-ghost">
              Edit
            </Button>
          </Link>
          <Button
            type="button"
            className="admin-action-btn bg-destructive text-white hover:bg-destructive/90"
            onClick={() => setPendingDelete(product)}
          >
            Delete
          </Button>
        </AdminRowActions>
      ),
    },
  ];

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Catalog"
        title="Products"
        description="Create, edit, and manage catalog products."
        actions={
          <Link href="/admin/products/new" className="block sm:inline-flex">
            <Button type="button" className="admin-btn-accent w-full sm:w-auto">
              Create product
            </Button>
          </Link>
        }
      />

      <AdminTableToolbar>
        <Input
          name="product-search"
          label="Search"
          value={search}
          placeholder="Name, slug, or SKU"
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          name="stock-filter"
          label="Inventory"
          value={stockFilter}
          options={[
            { value: "all", label: "All" },
            { value: "tracked", label: "Tracked" },
            { value: "not_tracked", label: "Not tracked" },
            { value: "low_stock", label: "Low stock" },
            { value: "out_of_stock", label: "Out of stock" },
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
        emptyTitle="No products yet"
        emptyDescription="Create the first product for your catalog."
        emptyAction={
          <Link href="/admin/products/new">
            <Button type="button" className="admin-btn-accent">
              Create product
            </Button>
          </Link>
        }
        footer={`${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete product?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be permanently removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
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
