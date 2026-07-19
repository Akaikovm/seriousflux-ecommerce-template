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
import { slugify } from "@/lib/slugify";
import { Input } from "@/shared/ui/Input";
import { LabelWithHint } from "@/shared/ui/Tooltip";
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
  sku: z.string().trim(),
  trackInventory: z.boolean(),
  stockQuantity: z.coerce.number().int().min(0, "Stock must be 0 or greater."),
  lowStockThreshold: z.coerce
    .number()
    .int()
    .min(0, "Threshold must be 0 or greater."),
  allowBackorders: z.boolean(),
  visibilityWhenOutOfStock: z.enum(["visible", "hidden"]),
});

type ProductFormValues = z.infer<typeof productFormSchema>;
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
        toast.success("Product created.");
        router.push("/admin/products");
      } else if (product) {
        await new ProductService().update(product.id, input);
        if (parsed.data.trackInventory) {
          await inventoryService.setQuantity({
            productId: product.id,
            quantity: parsed.data.stockQuantity,
          });
        }
        toast.success("Product updated.");
        setSnapshot({ ...parsed.data });
        setValues({ ...parsed.data });
      }

      router.refresh();
    } catch (err) {
      if (err instanceof ProductError || err instanceof InventoryError) {
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
            name="sku"
            label="SKU"
            value={values.sku}
            error={fieldErrors.sku}
            helperText="Optional commercial identifier."
            disabled={loading}
            onChange={(event) => setField("sku", event.target.value)}
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

          <div className="border-t border-border pt-5">
            <p className="mb-4 text-sm font-medium text-foreground">Inventory</p>

            <div className="flex flex-col gap-5">
              <Switch
                name="trackInventory"
                label={
                  <LabelWithHint hint="Enforces available units at checkout. Turn off to keep the product always sellable.">
                    Track inventory
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
                      <LabelWithHint hint="Units available to sell. Goes down when an order is paid; restored on cancel or refund.">
                        Stock quantity
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
                      <LabelWithHint hint="At or below this quantity: Low stock in Admin, and optional “Only X left” on the storefront.">
                        Low stock threshold
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
                      <LabelWithHint hint="Customers can still buy when quantity is 0. You fulfill after restocking.">
                        Allow backorders
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
                      <LabelWithHint hint="Keep visible shows out of stock. Hide removes it from listings when stock is zero and backorders are off.">
                        When out of stock
                      </LabelWithHint>
                    }
                    value={values.visibilityWhenOutOfStock}
                    error={fieldErrors.visibilityWhenOutOfStock}
                    disabled={loading}
                    options={[
                      { value: "visible", label: "Keep visible" },
                      { value: "hidden", label: "Hide from catalog" },
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
