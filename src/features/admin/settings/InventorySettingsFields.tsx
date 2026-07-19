"use client";

import { LabelWithHint } from "@/shared/ui/Tooltip";
import { Input } from "@/shared/ui/Input";
import { Switch } from "@/shared/ui/Switch";
import type { InventorySettings } from "@/features/settings/types";

export type InventoryFormValues = InventorySettings;

export type InventoryFieldErrors = Partial<
  Record<keyof InventoryFormValues, string>
>;

type InventorySettingsFieldsProps = {
  value: InventoryFormValues;
  errors?: InventoryFieldErrors;
  disabled?: boolean;
  onChange: (next: InventoryFormValues) => void;
};

/**
 * Store-wide inventory defaults (RFC-023). Per-product policy fields override these.
 */
export function InventorySettingsFields({
  value,
  errors,
  disabled,
  onChange,
}: InventorySettingsFieldsProps) {
  function patch<K extends keyof InventoryFormValues>(
    key: K,
    next: InventoryFormValues[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <Switch
        name="defaultTrackInventory"
        label={
          <LabelWithHint hint="New products start with stock tracking on. Turn the store default off for digital or made-to-order catalogs.">
            Track inventory on new products
          </LabelWithHint>
        }
        checked={value.defaultTrackInventory}
        disabled={disabled}
        onChange={(event) =>
          patch("defaultTrackInventory", event.target.checked)
        }
      />

      <Input
        name="defaultLowStockThreshold"
        label={
          <LabelWithHint hint="At or below this quantity, Admin shows Low stock (list, filters, dashboard).">
            Default low stock threshold
          </LabelWithHint>
        }
        type="number"
        min={0}
        step={1}
        value={String(value.defaultLowStockThreshold)}
        error={errors?.defaultLowStockThreshold}
        disabled={disabled}
        onChange={(event) =>
          patch(
            "defaultLowStockThreshold",
            Number(event.target.value || 0),
          )
        }
      />

      <Switch
        name="defaultAllowBackorders"
        label={
          <LabelWithHint hint="New products can still be bought when stock is 0. You fulfill after restocking.">
            Allow backorders by default
          </LabelWithHint>
        }
        checked={value.defaultAllowBackorders}
        disabled={disabled}
        onChange={(event) =>
          patch("defaultAllowBackorders", event.target.checked)
        }
      />

      <Switch
        name="hideOutOfStockProducts"
        label={
          <LabelWithHint hint="Hide tracked products with zero stock (and no backorders) from catalog listings.">
            Hide out-of-stock products in catalog
          </LabelWithHint>
        }
        checked={value.hideOutOfStockProducts}
        disabled={disabled}
        onChange={(event) =>
          patch("hideOutOfStockProducts", event.target.checked)
        }
      />

      <Switch
        name="showRemainingStock"
        label={
          <LabelWithHint hint='When stock is low, product pages can show “Only X left”.'>
            Show remaining stock on storefront
          </LabelWithHint>
        }
        checked={value.showRemainingStock}
        disabled={disabled}
        onChange={(event) =>
          patch("showRemainingStock", event.target.checked)
        }
      />
    </div>
  );
}
