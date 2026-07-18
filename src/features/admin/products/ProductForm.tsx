"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import { ImageUpload } from "@/features/media/components/ImageUpload";
import {
  AdminBackLink,
  AdminFormLayout,
  AdminPage,
  AdminPageHeader,
  AdminSaveBar,
} from "@/features/admin/ui";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import type { Product } from "@/features/products/types";
import { slugify } from "@/lib/slugify";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { Switch } from "@/shared/ui/Switch";
import { Textarea } from "@/shared/ui/Textarea";
import { useToast } from "@/shared/ui/Toast";

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
  description: z.string().trim().min(1, "Description is required."),
  image: z.string(),
  price: z.coerce.number().min(0, "Price must be 0 or greater."),
  currency: z.string().trim().min(1, "Currency is required."),
  categoryId: z.string().trim().min(1, "Category is required."),
  featured: z.boolean(),
  active: z.boolean(),
  order: z.coerce.number().int().min(0, "Order must be 0 or greater."),
});

type ProductFormValues = z.infer<typeof productFormSchema>;
type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

type CategoryOption = {
  id: string;
  name: string;
};

type ProductFormProps = {
  mode: "create" | "edit";
  product?: Product;
  categories: CategoryOption[];
  defaultCurrency: string;
};

function toInitialValues(
  product: Product | undefined,
  defaultCurrency: string,
): ProductFormValues {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    image: product?.image ?? "",
    price: product?.price ?? 0,
    currency: product?.currency ?? defaultCurrency,
    categoryId: product?.categoryId ?? "",
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    order: product?.order ?? 0,
  };
}

/**
 * Controlled create/edit form for products (RFC-012).
 * Persists through ProductService only. Images upload via MediaService.
 */
export function ProductForm({
  mode,
  product,
  categories,
  defaultCurrency,
}: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<ProductFormValues>(() =>
    toInitialValues(product, defaultCurrency),
  );
  const [snapshot, setSnapshot] = useState<ProductFormValues>(() =>
    toInitialValues(product, defaultCurrency),
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(snapshot);

  function setField<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleDiscard() {
    setValues({ ...snapshot });
    setFieldErrors({});
    setFormError(null);
    setSlugTouched(mode === "edit");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || (mode === "edit" && !isDirty)) {
      return;
    }

    setFormError(null);
    const parsed = productFormSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ProductFormValues | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const input = {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        image: parsed.data.image,
        price: parsed.data.price,
        currency: parsed.data.currency,
        categoryId: parsed.data.categoryId,
        featured: parsed.data.featured,
        active: parsed.data.active,
        order: parsed.data.order,
      };

      if (mode === "create") {
        await new ProductService().create(input);
        toast.success("Product created.");
        router.push("/admin/products");
      } else if (product) {
        await new ProductService().update(product.id, input);
        toast.success("Product updated.");
        setSnapshot({ ...parsed.data });
        setValues({ ...parsed.data });
      }

      router.refresh();
    } catch (err) {
      if (err instanceof ProductError) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        const message = "Unable to save product. Please try again.";
        setFormError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminPage narrow>
      <AdminBackLink href="/admin/products">Back to products</AdminBackLink>
      <AdminPageHeader
        eyebrow="Catalog"
        title={mode === "create" ? "Create product" : "Edit product"}
        description="Catalog products appear on the storefront when active."
      />

      <form onSubmit={handleSubmit} noValidate>
        {formError ? (
          <p role="alert" className="mb-4 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <AdminFormLayout
          footer={
            <AdminSaveBar
              dirty={isDirty}
              loading={loading}
              onDiscard={handleDiscard}
              saveLabel={mode === "create" ? "Create product" : "Save changes"}
            />
          }
        >
          <Input
            name="name"
            label="Name"
            value={values.name}
            error={fieldErrors.name}
            disabled={loading}
            onChange={(event) => {
              const name = event.target.value;
              setField("name", name);
              if (!slugTouched) {
                setField("slug", slugify(name));
              }
            }}
          />

          <Input
            name="slug"
            label="Slug"
            value={values.slug}
            error={fieldErrors.slug}
            helperText="URL-safe identifier. Lowercase letters, numbers, hyphens."
            disabled={loading}
            onChange={(event) => {
              setSlugTouched(true);
              setField("slug", event.target.value);
            }}
          />

          <Textarea
            name="description"
            label="Description"
            value={values.description}
            error={fieldErrors.description}
            disabled={loading}
            onChange={(event) => setField("description", event.target.value)}
          />

          <ImageUpload
            label="Image"
            folder="products"
            value={values.image}
            error={fieldErrors.image}
            helperText="Optional. You can add or update the image later."
            disabled={loading}
            onChange={(url) => setField("image", url)}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              name="price"
              label="Price"
              type="number"
              min={0}
              step="0.01"
              value={String(values.price)}
              error={fieldErrors.price}
              disabled={loading}
              onChange={(event) =>
                setField("price", Number(event.target.value || 0))
              }
            />
            <Input
              name="currency"
              label="Currency"
              value={values.currency}
              error={fieldErrors.currency}
              disabled={loading}
              onChange={(event) => setField("currency", event.target.value)}
            />
          </div>

          <Select
            name="categoryId"
            label="Category"
            value={values.categoryId}
            error={fieldErrors.categoryId}
            disabled={loading || categories.length === 0}
            placeholder="Select a category"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            onChange={(event) => setField("categoryId", event.target.value)}
          />

          <Input
            name="order"
            label="Order"
            type="number"
            min={0}
            step={1}
            value={String(values.order)}
            error={fieldErrors.order}
            disabled={loading}
            onChange={(event) =>
              setField("order", Number(event.target.value || 0))
            }
          />

          <Switch
            name="featured"
            label="Featured"
            checked={values.featured}
            disabled={loading}
            onChange={(event) => setField("featured", event.target.checked)}
          />

          <Switch
            name="active"
            label="Active"
            checked={values.active}
            disabled={loading}
            onChange={(event) => setField("active", event.target.checked)}
          />
        </AdminFormLayout>
      </form>
    </AdminPage>
  );
}
