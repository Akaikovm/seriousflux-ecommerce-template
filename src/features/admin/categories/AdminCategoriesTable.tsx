"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CategoryFormData } from "@/features/admin/categories/category-form-data";
import { DataTable } from "@/features/admin/components/DataTable";
import type { AdminDataTableColumn } from "@/features/admin/types";
import {
  AdminPage,
  AdminPageHeader,
  AdminRowActions,
} from "@/features/admin/ui";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { useToast } from "@/shared/ui/Toast";

type AdminCategoriesTableProps = {
  categories: CategoryFormData[];
};

/**
 * Admin categories list (RFC-012).
 * Actions navigate to form routes or call CategoryService.
 * DataTable remains presentational.
 */
export function AdminCategoriesTable({ categories }: AdminCategoriesTableProps) {
  const router = useRouter();
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<CategoryFormData | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleDelete() {
    if (!pendingDelete || deleting) {
      return;
    }

    setDeleting(true);
    try {
      await new CategoryService().delete(pendingDelete.id);
      toast.success("Category deleted.");
      setPendingDelete(null);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof CategoryError
          ? err.message
          : "Unable to delete category.";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActive(category: CategoryFormData) {
    if (togglingId) {
      return;
    }

    setTogglingId(category.id);
    try {
      await new CategoryService().update(category.id, {
        active: !category.active,
      });
      toast.success(
        category.active ? "Category disabled." : "Category enabled.",
      );
      router.refresh();
    } catch (err) {
      const message =
        err instanceof CategoryError
          ? err.message
          : "Unable to update category.";
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  }

  const columns: AdminDataTableColumn<CategoryFormData>[] = [
    {
      id: "image",
      header: "Image",
      className: "w-16",
      cell: (category) =>
        category.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client; next/image domains are not fixed yet
          <img
            src={category.image}
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
      cell: (category) => (
        <p className="font-medium text-foreground">{category.name}</p>
      ),
    },
    {
      id: "slug",
      header: "Slug",
      cell: (category) => (
        <span className="text-muted-foreground">{category.slug}</span>
      ),
    },
    {
      id: "featured",
      header: "Featured",
      cell: (category) => (
        <Badge variant={category.featured ? "primary" : "secondary"}>
          {category.featured ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      id: "active",
      header: "Active",
      cell: (category) => (
        <Badge variant={category.active ? "primary" : "secondary"}>
          {category.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "order",
      header: "Order",
      cell: (category) => category.order,
    },
    {
      id: "actions",
      header: "Actions",
      className: "text-right",
      cell: (category) => (
        <AdminRowActions>
          <Button
            type="button"
            className="admin-action-btn admin-btn-ghost"
            loading={togglingId === category.id}
            onClick={() => void handleToggleActive(category)}
          >
            {category.active ? "Disable" : "Enable"}
          </Button>
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="inline-flex"
          >
            <Button type="button" className="admin-action-btn admin-btn-ghost">
              Edit
            </Button>
          </Link>
          <Button
            type="button"
            className="admin-action-btn bg-destructive text-white hover:bg-destructive/90"
            onClick={() => setPendingDelete(category)}
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
        title="Categories"
        description="Create, edit, and organize catalog categories."
        actions={
          <Link href="/admin/categories/new" className="block sm:inline-flex">
            <Button type="button" className="admin-btn-accent w-full sm:w-auto">
              Create category
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={categories}
        getRowId={(category) => category.id}
        emptyTitle="No categories yet"
        emptyDescription="Create the first category to organize your catalog."
        emptyAction={
          <Link href="/admin/categories/new">
            <Button type="button" className="admin-btn-accent">
              Create category
            </Button>
          </Link>
        }
        footer={`${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete category?"
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
