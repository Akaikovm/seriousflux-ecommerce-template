"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import type { CategoryFormData } from "@/features/admin/categories/category-form-data";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import { ImageUpload } from "@/features/media/components/ImageUpload";
import { slugify } from "@/lib/slugify";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Switch } from "@/shared/ui/Switch";
import { Textarea } from "@/shared/ui/Textarea";
import { useToast } from "@/shared/ui/Toast";

const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only.",
    ),
  description: z.string().trim(),
  image: z.string(),
  featured: z.boolean(),
  active: z.boolean(),
  order: z.coerce.number().int().min(0, "Order must be 0 or greater."),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;
type FieldErrors = Partial<Record<keyof CategoryFormValues, string>>;

type CategoryFormProps = {
  mode: "create" | "edit";
  category?: CategoryFormData;
};

function toInitialValues(category?: CategoryFormData): CategoryFormValues {
  return {
    name: category?.name ?? "",
    slug: category?.slug ?? "",
    description: category?.description ?? "",
    image: category?.image ?? "",
    featured: category?.featured ?? false,
    active: category?.active ?? true,
    order: category?.order ?? 0,
  };
}

/**
 * Controlled create/edit form for categories (RFC-012).
 * Persists through CategoryService only. Images upload via MediaService.
 */
export function CategoryForm({ mode, category }: CategoryFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<CategoryFormValues>(() =>
    toInitialValues(category),
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) {
      return;
    }

    setFormError(null);
    const parsed = categoryFormSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CategoryFormValues | undefined;
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
        description: parsed.data.description || undefined,
        image: parsed.data.image,
        featured: parsed.data.featured,
        active: parsed.data.active,
        order: parsed.data.order,
      };

      if (mode === "create") {
        await new CategoryService().create(input);
        toast.success("Category created.");
      } else if (category) {
        await new CategoryService().update(category.id, input);
        toast.success("Category updated.");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      if (err instanceof CategoryError) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        const message = "Unable to save category. Please try again.";
        setFormError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg" className="w-full max-w-2xl">
      <form className="flex flex-col gap-4 sm:gap-5" onSubmit={handleSubmit} noValidate>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {mode === "create" ? "Create category" : "Edit category"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Catalog categories power storefront navigation and product grouping.
          </p>
        </div>

        {formError ? (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        ) : null}

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
          folder="categories"
          value={values.image}
          error={fieldErrors.image}
          disabled={loading}
          onChange={(url) => setField("image", url)}
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

        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" loading={loading}>
            {mode === "create" ? "Create category" : "Save changes"}
          </Button>
          <Button
            type="button"
            disabled={loading}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={() => router.push("/admin/categories")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
