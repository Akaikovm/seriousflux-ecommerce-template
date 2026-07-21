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
import { useT } from "@/i18n";
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
  const t = useT();
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
      toast.success(t("admin.categories.deleted"));
      setPendingDelete(null);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof CategoryError
          ? err.message
          : t("admin.categories.deleteFailed");
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
        category.active
          ? t("admin.categories.disabled")
          : t("admin.categories.enabled"),
      );
      router.refresh();
    } catch (err) {
      const message =
        err instanceof CategoryError
          ? err.message
          : t("admin.categories.updateFailed");
      toast.error(message);
    } finally {
      setTogglingId(null);
    }
  }

  const columns: AdminDataTableColumn<CategoryFormData>[] = [
    {
      id: "image",
      header: t("admin.categories.columns.image"),
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
      header: t("admin.categories.columns.name"),
      cell: (category) => (
        <p className="font-medium text-foreground">{category.name}</p>
      ),
    },
    {
      id: "slug",
      header: t("admin.categories.columns.slug"),
      cell: (category) => (
        <span className="text-muted-foreground">{category.slug}</span>
      ),
    },
    {
      id: "featured",
      header: t("admin.categories.columns.featured"),
      cell: (category) => (
        <Badge variant={category.featured ? "primary" : "secondary"}>
          {category.featured ? t("common.yes") : t("common.no")}
        </Badge>
      ),
    },
    {
      id: "active",
      header: t("admin.categories.fields.active"),
      cell: (category) => (
        <Badge variant={category.active ? "primary" : "secondary"}>
          {category.active ? t("common.active") : t("common.inactive")}
        </Badge>
      ),
    },
    {
      id: "order",
      header: t("admin.categories.columns.order"),
      cell: (category) => category.order,
    },
    {
      id: "actions",
      header: t("admin.categories.columns.actions"),
      className: "text-right",
      cell: (category) => (
        <AdminRowActions>
          <Button
            type="button"
            className="admin-action-btn admin-btn-ghost"
            loading={togglingId === category.id}
            onClick={() => void handleToggleActive(category)}
          >
            {category.active ? t("common.disable") : t("common.enable")}
          </Button>
          <Link
            href={`/admin/categories/${category.id}/edit`}
            className="inline-flex"
          >
            <Button type="button" className="admin-action-btn admin-btn-ghost">
              {t("common.edit")}
            </Button>
          </Link>
          <Button
            type="button"
            className="admin-action-btn bg-destructive text-white hover:bg-destructive/90"
            onClick={() => setPendingDelete(category)}
          >
            {t("common.delete")}
          </Button>
        </AdminRowActions>
      ),
    },
  ];

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow={t("admin.categories.eyebrow")}
        title={t("admin.categories.title")}
        description={t("admin.categories.description")}
        actions={
          <Link href="/admin/categories/new" className="block sm:inline-flex">
            <Button type="button" className="admin-btn-accent w-full sm:w-auto">
              {t("admin.categories.create")}
            </Button>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        rows={categories}
        getRowId={(category) => category.id}
        emptyTitle={t("admin.categories.emptyTitle")}
        emptyDescription={t("admin.categories.emptyDescription")}
        emptyAction={
          <Link href="/admin/categories/new">
            <Button type="button" className="admin-btn-accent">
              {t("admin.categories.create")}
            </Button>
          </Link>
        }
        footer={t("admin.categories.footerCount", { count: categories.length })}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t("admin.categories.deleteTitle")}
        description={
          pendingDelete ? t("admin.categories.deleteDescription") : undefined
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
