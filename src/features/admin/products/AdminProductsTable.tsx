"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { DataTable } from "@/features/admin/components/DataTable";
import type { AdminDataTableColumn } from "@/features/admin/types";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import type { Product } from "@/features/products/types";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { useToast } from "@/shared/ui/Toast";

type AdminProductsTableProps = {
  products: Product[];
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
 * Admin products list (RFC-012).
 * Actions navigate to form routes or call ProductService.
 * DataTable remains presentational.
 */
export function AdminProductsTable({
  products,
  categoryNames,
  locale,
  currency,
}: AdminProductsTableProps) {
  const router = useRouter();
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  async function handleToggleActive(product: Product) {
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

  const columns: AdminDataTableColumn<Product>[] = [
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
        <div className="admin-actions">
          <Button
            type="button"
            className="admin-action-btn bg-secondary text-secondary-foreground hover:bg-secondary/80"
            loading={togglingId === product.id}
            onClick={() => void handleToggleActive(product)}
          >
            {product.active ? "Disable" : "Enable"}
          </Button>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="inline-flex"
          >
            <Button
              type="button"
              className="admin-action-btn bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
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
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="admin-page-header">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, and manage catalog products.
          </p>
        </div>
        <div className="admin-page-header__cta">
          <Link href="/admin/products/new" className="block w-full sm:inline-flex sm:w-auto">
            <Button type="button" className="w-full sm:w-auto">
              Create product
            </Button>
          </Link>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={products}
        getRowId={(product) => product.id}
        emptyTitle="No products yet"
        emptyDescription="Create the first product for your catalog."
        emptyAction={
          <Link href="/admin/products/new">
            <Button type="button">Create product</Button>
          </Link>
        }
        footer={`${products.length} product${products.length === 1 ? "" : "s"}`}
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
    </div>
  );
}
