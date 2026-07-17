import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/features/admin/categories/CategoryForm";
import { toCategoryFormData } from "@/features/admin/categories/category-form-data";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";

export const metadata: Metadata = {
  title: "Edit category",
};

type AdminEditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Admin edit category — `/admin/categories/[id]/edit`.
 */
export default async function AdminEditCategoryPage({
  params,
}: AdminEditCategoryPageProps) {
  const { id } = await params;

  let category = null;
  try {
    category = await new CategoryService().getById(id);
  } catch (error) {
    if (error instanceof CategoryError) {
      console.error(`[CategoryService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[CategoryService] Unexpected error loading category",
        error,
      );
    }
  }

  if (!category) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/categories"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to categories
        </Link>
      </div>
      <CategoryForm mode="edit" category={toCategoryFormData(category)} />
    </div>
  );
}
