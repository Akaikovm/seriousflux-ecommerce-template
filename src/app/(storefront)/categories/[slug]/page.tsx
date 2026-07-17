import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import type { Category } from "@/features/categories/types";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import type { Product } from "@/features/products/types";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { Container } from "@/shared/components/Container";
import { Section } from "@/shared/components/Section";
import { SectionTitle } from "@/shared/components/SectionTitle";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Loads an active category by slug.
 * Returns `null` when missing, inactive, or when CategoryService fails (logged).
 */
async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const category = await new CategoryService().getBySlug(slug);

    if (!category || !category.active) {
      return null;
    }

    return category;
  } catch (error) {
    if (error instanceof CategoryError) {
      console.error(`[CategoryService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[CategoryService] Unexpected error loading category by slug",
        error,
      );
    }

    return null;
  }
}

async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    return await new ProductService().getByCategory(categoryId);
  } catch (error) {
    if (error instanceof ProductError) {
      console.error(`[ProductService] ${error.code}: ${error.message}`);
    } else {
      console.error(
        "[ProductService] Unexpected error loading products by category",
        error,
      );
    }

    return [];
  }
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category not found",
      description: "The requested category could not be found.",
    };
  }

  return {
    title: category.name,
    description:
      category.description?.trim() ||
      `Browse products in ${category.name}.`,
  };
}

/**
 * Category landing route — `/categories/[slug]`.
 *
 * Composition root: resolves category via CategoryService, lists products via
 * ProductService.getByCategory. Never imports Firebase in UI.
 */
export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const [settings, products] = await Promise.all([
    getStoreSettings(),
    getProductsByCategory(category.id),
  ]);

  return (
    <Section aria-labelledby="category-title">
      <Container>
        <SectionTitle
          id="category-title"
          title={category.name}
          subtitle={
            category.description?.trim() ||
            `Products in ${category.name}.`
          }
        />
        <ProductGrid
          products={products}
          locale={settings.locale}
          currency={settings.currency}
          emptyTitle="No products in this category"
          emptyDescription="Products assigned to this category will appear here once published."
        />
      </Container>
    </Section>
  );
}
