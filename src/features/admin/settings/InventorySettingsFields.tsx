"use client";

import { LabelWithHint } from "@/shared/ui/Tooltip";
import { Input } from "@/shared/ui/Input";
import { Switch } from "@/shared/ui/Switch";
import type { InventorySettings } from "@/features/settings/types";
import { useT } from "@/i18n";

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
  const t = useT();

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
          <LabelWithHint
            hint={t("admin.settings.inventory.trackOnNewProductsHelper")}
          >
            {t("admin.settings.inventory.trackOnNewProducts")}
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
          <LabelWithHint
            hint={t("admin.settings.inventory.defaultLowStockThresholdHelper")}
          >
            {t("admin.settings.inventory.defaultLowStockThreshold")}
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
          <LabelWithHint
            hint={t("admin.settings.inventory.allowBackordersByDefaultHelper")}
          >
            {t("admin.settings.inventory.allowBackordersByDefault")}
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
          <LabelWithHint
            hint={t("admin.settings.inventory.hideOutOfStockInCatalogHelper")}
          >
            {t("admin.settings.inventory.hideOutOfStockInCatalog")}
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
          <LabelWithHint
            hint={t("admin.settings.inventory.showRemainingStockHelper")}
          >
            {t("admin.settings.inventory.showRemainingStock")}
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
