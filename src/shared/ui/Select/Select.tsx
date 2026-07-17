import type { ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/**
 * Design System Select — native select with label / error.
 * Presentation only. No validation logic.
 */

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  id?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function Select({
  label,
  helperText,
  error,
  id,
  name,
  disabled = false,
  className,
  style,
  options,
  placeholder,
  ...props
}: SelectProps) {
  const fieldId = id ?? (name ? `select-${name}` : undefined);
  const describedById = fieldId
    ? error
      ? `${fieldId}-error`
      : helperText
        ? `${fieldId}-helper`
        : undefined
    : undefined;
  const hasError = Boolean(error);

  return (
    <div className="flex w-full flex-col" style={{ gap: spacing.sm }}>
      {label ? (
        <label
          htmlFor={fieldId}
          className="text-foreground"
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          {label}
        </label>
      ) : null}

      <select
        id={fieldId}
        name={name}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={describedById}
        className={cn(
          "w-full cursor-pointer bg-background text-foreground",
          "border border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          hasError && "border-destructive focus-visible:ring-destructive/40",
          className,
        )}
        style={{
          paddingBlock: spacing.sm,
          paddingInline: spacing.md,
          borderRadius: radius.md,
          fontSize: typography.fontSize.sm,
          lineHeight: typography.lineHeight.normal,
          transitionProperty: "border-color, box-shadow, opacity",
          transitionDuration: transition.fast,
          ...style,
        }}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

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
      ) : helperText ? (
        <p
          id={describedById}
          className="text-muted-foreground"
          style={{
            fontSize: typography.fontSize.xs,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
