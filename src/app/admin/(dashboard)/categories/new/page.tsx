import type { Metadata } from "next";
import Link from "next/link";

import { CategoryForm } from "@/features/admin/categories/CategoryForm";

export const metadata: Metadata = {
  title: "Create category",
};

/**
 * Admin create category — `/admin/categories/new`.
 */
export default function AdminCreateCategoryPage() {
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
      <CategoryForm mode="create" />
    </div>
  );
}
