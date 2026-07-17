"use client";

import { cn } from "@/lib/utils";
import type {
  CheckoutPaymentOption,
  PaymentMethod,
} from "@/features/payments/types";
import { spacing, typography } from "@/shared/design/tokens";

type PaymentMethodSelectorProps = {
  /** Currently selected method. */
  value: PaymentMethod;
  /** Called when the customer picks a different method. */
  onChange: (method: PaymentMethod) => void;
  /**
   * Enabled + registered providers from StoreSettings (RFC-016.5).
   * Labels come from `displayName` / `description` — never hardcoded here.
   */
  options: CheckoutPaymentOption[];
  disabled?: boolean;
  error?: string;
  name?: string;
};

/**
 * Controlled radio group for checkout payment method selection (RFC-016.5).
 * No provider SDK calls — presentation and selection only.
 */
export function PaymentMethodSelector({
  value,
  onChange,
  options,
  disabled = false,
  error,
  name = "paymentMethod",
}: PaymentMethodSelectorProps) {
  const groupName = name;
  const describedById = error ? `${groupName}-error` : undefined;

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No payment methods are available for this store.
      </p>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{ gap: spacing.md }}
      role="radiogroup"
      aria-labelledby={`${groupName}-legend`}
      aria-describedby={describedById}
      aria-invalid={error ? true : undefined}
    >
      <span
        id={`${groupName}-legend`}
        className="sr-only"
      >
        Payment method
      </span>

      {options.map((option) => {
        const inputId = `${groupName}-${option.id}`;
        const isSelected = value === option.id;

        return (
          <label
            key={option.id}
            htmlFor={inputId}
            className={cn(
              "flex cursor-pointer gap-3 rounded-md border p-4 transition-colors",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-input bg-background hover:border-muted-foreground/40",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              id={inputId}
              type="radio"
              name={groupName}
              value={option.id}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onChange(option.id)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span
                className="font-medium text-foreground"
                style={{ fontSize: typography.fontSize.sm }}
              >
                {option.displayName}
              </span>
              {option.description ? (
                <span
                  className="text-muted-foreground"
                  style={{ fontSize: typography.fontSize.xs }}
                >
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}

      {error ? (
        <p
          id={describedById}
          role="alert"
          className="text-destructive"
          style={{
            fontSize: typography.fontSize.xs,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
