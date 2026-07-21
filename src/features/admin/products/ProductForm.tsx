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
  InventoryError,
  InventoryService,
} from "@/features/inventory/services";
import {
  ProductError,
  ProductService,
} from "@/features/products/services";
import type { Product } from "@/features/products/types";
import { useT, type TranslateFn } from "@/i18n";
import { slugify } from "@/lib/slugify";
import { Input } from "@/shared/ui/Input";
import { LabelWithHint } from "@/shared/ui/Tooltip";
import { Select } from "@/shared/ui/Select";
import { Switch } from "@/shared/ui/Switch";
import { Textarea } from "@/shared/ui/Textarea";
import { useToast } from "@/shared/ui/Toast";

function createProductFormSchema(t: TranslateFn) {
  return z.object({
    name: z.string().trim().min(1, t("admin.products.validation.nameRequired")),
    slug: z
      .string()
      .trim()
      .min(1, t("admin.products.validation.slugRequired"))
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        t("admin.products.validation.slugFormat"),
      ),
    description: z
      .string()
      .trim()
      .min(1, t("admin.products.validation.descriptionRequired")),
    image: z.string(),
    price: z.coerce
      .number()
      .min(0, t("admin.products.validation.priceMin")),
    currency: z
      .string()
      .trim()
      .min(1, t("admin.products.validation.currencyRequired")),
    categoryId: z
      .string()
      .trim()
      .min(1, t("admin.products.validation.categoryRequired")),
    featured: z.boolean(),
    active: z.boolean(),
    order: z.coerce
      .number()
      .int()
      .min(0, t("admin.products.validation.orderMin")),
    sku: z.string().trim(),
    trackInventory: z.boolean(),
    stockQuantity: z.coerce
      .number()
      .int()
      .min(0, t("admin.products.validation.stockMin")),
    lowStockThreshold: z.coerce
      .number()
      .int()
      .min(0, t("admin.products.validation.thresholdMin")),
    allowBackorders: z.boolean(),
    visibilityWhenOutOfStock: z.enum(["visible", "hidden"]),
  });
}

type ProductFormValues = z.infer<ReturnType<typeof createProductFormSchema>>;
type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

type CategoryOption = {
  id: string;
  name: string;
};

export type ProductFormInventoryDefaults = {
  trackInventory: boolean;
  lowStockThreshold: number;
  allowBackorders: boolean;
};

type ProductFormProps = {
  mode: "create" | "edit";
  product?: Product;
  /** Current inventory quantity when editing (from InventoryService). */
  initialStockQuantity?: number;
  categories: CategoryOption[];
  defaultCurrency: string;
  inventoryDefaults?: ProductFormInventoryDefaults;
};

function toInitialValues(
  product: Product | undefined,
  defaultCurrency: string,
  inventoryDefaults: ProductFormInventoryDefaults,
  initialStockQuantity: number,
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
    sku: product?.sku ?? "",
    trackInventory: product?.trackInventory ?? inventoryDefaults.trackInventory,
    stockQuantity: initialStockQuantity,
    lowStockThreshold:
      product?.lowStockThreshold ?? inventoryDefaults.lowStockThreshold,
    allowBackorders:
      product?.allowBackorders ?? inventoryDefaults.allowBackorders,
    visibilityWhenOutOfStock: product?.visibilityWhenOutOfStock ?? "visible",
  };
}

/**
 * Controlled create/edit form for products (RFC-012 / RFC-023).
 * Commercial fields → ProductService. Quantity → InventoryService only.
 */
export function ProductForm({
  mode,
  product,
  initialStockQuantity = 0,
  categories,
  defaultCurrency,
  inventoryDefaults = {
    trackInventory: true,
    lowStockThreshold: 5,
    allowBackorders: false,
  },
}: ProductFormProps) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState<ProductFormValues>(() =>
    toInitialValues(
      product,
      defaultCurrency,
      inventoryDefaults,
      initialStockQuantity,
    ),
  );
  const [snapshot, setSnapshot] = useState<ProductFormValues>(() =>
    toInitialValues(
      product,
      defaultCurrency,
      inventoryDefaults,
      initialStockQuantity,
    ),
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
    const parsed = createProductFormSchema(t).safeParse(values);

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
        sku: parsed.data.sku,
        trackInventory: parsed.data.trackInventory,
        lowStockThreshold: parsed.data.lowStockThreshold,
        allowBackorders: parsed.data.allowBackorders,
        visibilityWhenOutOfStock: parsed.data.visibilityWhenOutOfStock,
      };

      const inventoryService = new InventoryService();

      if (mode === "create") {
        const created = await new ProductService().create(input);
        if (parsed.data.trackInventory) {
          await inventoryService.setQuantity({
            productId: created.id,
            quantity: parsed.data.stockQuantity,
          });
        }
        toast.success(t("admin.products.created"));
        router.push("/admin/products");
      } else if (product) {
        await new ProductService().update(product.id, input);
        if (parsed.data.trackInventory) {
          await inventoryService.setQuantity({
            productId: product.id,
            quantity: parsed.data.stockQuantity,
          });
        }
        toast.success(t("admin.products.updated"));
        setSnapshot({ ...parsed.data });
        setValues({ ...parsed.data });
      }

      router.refresh();
    } catch (err) {
      if (err instanceof ProductError || err instanceof InventoryError) {
        setFormError(err.message);
        toast.error(err.message);
      } else {
        const message = t("admin.products.saveFailed");
        setFormError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminPage narrow>
      <AdminBackLink href="/admin/products">
        {t("admin.products.backToProducts")}
      </AdminBackLink>
      <AdminPageHeader
        eyebrow={t("admin.products.eyebrow")}
        title={
          mode === "create"
            ? t("admin.products.createTitle")
            : t("admin.products.editTitle")
        }
        description={t("admin.products.formDescription")}
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
                  ? t("admin.products.saveCreate")
                  : t("admin.products.saveEdit")
              }
            />
          }
        >
          <Input
            name="name"
            label={t("admin.products.fields.name")}
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
            label={t("admin.products.fields.slug")}
            value={values.slug}
            error={fieldErrors.slug}
            helperText={t("admin.products.fields.slugHelper")}
            disabled={loading}
            onChange={(event) => {
              setSlugTouched(true);
              setField("slug", event.target.value);
            }}
          />

          <Textarea
            name="description"
            label={t("admin.products.fields.description")}
            value={values.description}
            error={fieldErrors.description}
            disabled={loading}
            onChange={(event) => setField("description", event.target.value)}
          />

          <ImageUpload
            label={t("admin.products.fields.image")}
            folder="products"
            value={values.image}
            error={fieldErrors.image}
            helperText={t("admin.products.fields.imageHelper")}
            disabled={loading}
            onChange={(url) => setField("image", url)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="price"
              label={t("admin.products.fields.price")}
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
              label={t("admin.products.fields.currency")}
              value={values.currency}
              error={fieldErrors.currency}
              disabled={loading}
              onChange={(event) => setField("currency", event.target.value)}
            />
          </div>

          <Select
            name="categoryId"
            label={t("admin.products.fields.category")}
            value={values.categoryId}
            error={fieldErrors.categoryId}
            disabled={loading || categories.length === 0}
            placeholder={t("admin.products.fields.categoryPlaceholder")}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            onChange={(event) => setField("categoryId", event.target.value)}
          />

          <Input
            name="sku"
            label={t("admin.products.fields.sku")}
            value={values.sku}
            error={fieldErrors.sku}
            helperText={t("admin.products.fields.skuHelper")}
            disabled={loading}
            onChange={(event) => setField("sku", event.target.value)}
          />

          <Input
            name="order"
            label={t("admin.products.fields.order")}
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
            label={t("admin.products.fields.featured")}
            checked={values.featured}
            disabled={loading}
            onChange={(event) => setField("featured", event.target.checked)}
          />

          <Switch
            name="active"
            label={t("admin.products.fields.active")}
            checked={values.active}
            disabled={loading}
            onChange={(event) => setField("active", event.target.checked)}
          />

          <div className="border-t border-[var(--admin-border-subtle)] pt-4">
            <p className="mb-3 text-sm font-medium text-[var(--admin-fg)]">
              {t("admin.products.fields.inventory")}
            </p>

            <div className="flex flex-col gap-4">
              <Switch
                name="trackInventory"
                label={
                  <LabelWithHint
                    hint={t("admin.products.fields.trackInventoryHint")}
                  >
                    {t("admin.products.fields.trackInventory")}
                  </LabelWithHint>
                }
                checked={values.trackInventory}
                disabled={loading}
                onChange={(event) =>
                  setField("trackInventory", event.target.checked)
                }
              />

              {values.trackInventory ? (
                <>
                  <Input
                    name="stockQuantity"
                    label={
                      <LabelWithHint
                        hint={t("admin.products.fields.stockQuantityHint")}
                      >
                        {t("admin.products.fields.stockQuantity")}
                      </LabelWithHint>
                    }
                    type="number"
                    min={0}
                    step={1}
                    value={String(values.stockQuantity)}
                    error={fieldErrors.stockQuantity}
                    disabled={loading}
                    onChange={(event) =>
                      setField(
                        "stockQuantity",
                        Number(event.target.value || 0),
                      )
                    }
                  />

                  <Input
                    name="lowStockThreshold"
                    label={
                      <LabelWithHint
                        hint={t("admin.products.fields.lowStockThresholdHint")}
                      >
                        {t("admin.products.fields.lowStockThreshold")}
                      </LabelWithHint>
                    }
                    type="number"
                    min={0}
                    step={1}
                    value={String(values.lowStockThreshold)}
                    error={fieldErrors.lowStockThreshold}
                    disabled={loading}
                    onChange={(event) =>
                      setField(
                        "lowStockThreshold",
                        Number(event.target.value || 0),
                      )
                    }
                  />

                  <Switch
                    name="allowBackorders"
                    label={
                      <LabelWithHint
                        hint={t("admin.products.fields.allowBackorderHint")}
                      >
                        {t("admin.products.fields.allowBackorder")}
                      </LabelWithHint>
                    }
                    checked={values.allowBackorders}
                    disabled={loading}
                    onChange={(event) =>
                      setField("allowBackorders", event.target.checked)
                    }
                  />

                  <Select
                    name="visibilityWhenOutOfStock"
                    label={
                      <LabelWithHint
                        hint={t("admin.products.fields.visibilityHint")}
                      >
                        {t("admin.products.fields.visibilityWhenOutOfStock")}
                      </LabelWithHint>
                    }
                    value={values.visibilityWhenOutOfStock}
                    error={fieldErrors.visibilityWhenOutOfStock}
                    disabled={loading}
                    options={[
                      {
                        value: "visible",
                        label: t("admin.products.fields.keepVisible"),
                      },
                      {
                        value: "hidden",
                        label: t("admin.products.fields.hideFromCatalog"),
                      },
                    ]}
                    onChange={(event) =>
                      setField(
                        "visibilityWhenOutOfStock",
                        event.target.value as "visible" | "hidden",
                      )
                    }
                  />
                </>
              ) : null}
            </div>
          </div>
        </AdminFormLayout>
      </form>
    </AdminPage>
  );
}
