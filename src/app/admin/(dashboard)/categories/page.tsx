import type { Metadata } from "next";

import { AdminCategoriesTable } from "@/features/admin/categories/AdminCategoriesTable";
import { toCategoryFormData } from "@/features/admin/categories/category-form-data";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import type { Category } from "@/features/categories/types";

export const metadata: Metadata = {
  title: "Categories",
};

async function getCategories(): Promise<Category[]> {
  try {
    return await new CategoryService().listAll();
  } catch (error) {
    if (error instanceof CategoryError) {
      console.error(`[CategoryService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[CategoryService] Unexpected error listing categories",
        error,
      );
    }
    return [];
  }
}

/**
 * Admin categories — `/admin/categories`.
 */
export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <AdminCategoriesTable
      categories={categories.map(toCategoryFormData)}
    />
  );
}
