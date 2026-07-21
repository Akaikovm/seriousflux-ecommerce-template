"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import type { CategoryFormData } from "@/features/admin/categories/category-form-data";
import {
  AdminBackLink,
  AdminFormLayout,
  AdminPage,
  AdminPageHeader,
  AdminSaveBar,
} from "@/features/admin/ui";
import {
  CategoryError,
  CategoryService,
} from "@/features/categories/services";
import { ImageUpload } from "@/features/media/components/ImageUpload";
import { useT, type TranslateFn } from "@/i18n";
import { slugify } from "@/lib/slugify";
import { Input } from "@/shared/ui/Input";
import { Switch } from "@/shared/ui/Switch";
import { Textarea } from "@/shared/ui/Textarea";
import { useToast } from "@/shared/ui/Toast";

function createCategoryFormSchema(t: TranslateFn) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("admin.categories.validation.nameRequired")),
    slug: z
      .string()
      .trim()
      .min(1, t("admin.categories.validation.slugRequired"))
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        t("admin.categories.validation.slugFormat"),
      ),
    description: z.string().trim(),
    image: z.string(),
    featured: z.boolean(),
    active: z.boolean(),
    order: z.coerce
      .number()
      .int()
      .min(0, t("admin.categories.validation.orderMin")),
  });
}

type CategoryFormValues = z.infer<ReturnType<typeof createCategoryFormSchema>>;
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
 * Controlled create/edit form for categories (ADR-021).
 */
export function CategoryForm({ mode, category }: CategoryFormProps) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<CategoryFormValues>(() =>
    toInitialValues(category),
  );
  const [snapshot, setSnapshot] = useState<CategoryFormValues>(() =>
    toInitialValues(category),
  );
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(snapshot);

  function setField<K extends keyof CategoryFormValues>(
    key: K,
    value: CategoryFormValues[K],
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
    const parsed = createCategoryFormSchema(t).safeParse(values);

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
        toast.success(t("admin.categories.created"));
        router.push("/admin/categories");
      } else if (category) {
        await new CategoryService().update(category.id, input);
        toast.success(t("admin.categories.updated"));
        setSnapshot({ ...parsed.data });
        setValues({ ...parsed.data });
      }

      router.refresh();
    } catch (err) {
      if (err instanceof CategoryError) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        const message = t("admin.categories.saveFailed");
        setFormError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminPage narrow>
      <AdminBackLink href="/admin/categories">
        {t("admin.categories.backToCategories")}
      </AdminBackLink>
      <AdminPageHeader
        eyebrow={t("admin.categories.eyebrow")}
        title={
          mode === "create"
            ? t("admin.categories.createTitle")
            : t("admin.categories.editTitle")
        }
        description={t("admin.categories.formDescription")}
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
              saveLabel={
                mode === "create"
                  ? t("admin.categories.saveCreate")
                  : t("admin.categories.saveEdit")
              }
            />
          }
        >
          <Input
            name="name"
            label={t("admin.categories.fields.name")}
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
            label={t("admin.categories.fields.slug")}
            value={values.slug}
            error={fieldErrors.slug}
            helperText={t("admin.categories.fields.slugHelper")}
            disabled={loading}
            onChange={(event) => {
              setSlugTouched(true);
              setField("slug", event.target.value);
            }}
          />

          <Textarea
            name="description"
            label={t("admin.categories.fields.description")}
            value={values.description}
            error={fieldErrors.description}
            disabled={loading}
            onChange={(event) => setField("description", event.target.value)}
          />

          <ImageUpload
            label={t("admin.categories.fields.image")}
            folder="categories"
            value={values.image}
            error={fieldErrors.image}
            disabled={loading}
            onChange={(url) => setField("image", url)}
          />

          <Input
            name="order"
            label={t("admin.categories.fields.order")}
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
            label={t("admin.categories.fields.featured")}
            checked={values.featured}
            disabled={loading}
            onChange={(event) => setField("featured", event.target.checked)}
          />

          <Switch
            name="active"
            label={t("admin.categories.fields.active")}
            checked={values.active}
            disabled={loading}
            onChange={(event) => setField("active", event.target.checked)}
          />
        </AdminFormLayout>
      </form>
    </AdminPage>
  );
}
