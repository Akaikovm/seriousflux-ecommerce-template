import type { Metadata } from "next";

import { CategoryForm } from "@/features/admin/categories/CategoryForm";

export const metadata: Metadata = {
  title: "Create category",
};

/**
 * Admin create category — `/admin/categories/new`.
 */
export default function AdminCreateCategoryPage() {
  return <CategoryForm mode="create" />;
}
