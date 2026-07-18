import type { Metadata } from "next";
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
    <CategoryForm mode="edit" category={toCategoryFormData(category)} />
  );
}
