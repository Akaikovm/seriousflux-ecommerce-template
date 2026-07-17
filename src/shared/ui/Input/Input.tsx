import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

/**
 * Design System Input — labeled text field.
 *
 * Presentation only. No validation logic.
 * Supports label, placeholder, disabled, error, and helper text.
 */

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  /** Visible field label. */
  label?: ReactNode;
  /** Helper copy shown below the field when there is no error. */
  helperText?: ReactNode;
  /** Error message. When set, the field is marked invalid. */
  error?: ReactNode;
  /** Optional id. Auto-derived from name when omitted. */
  id?: string;
};

export function Input({
  label,
  helperText,
  error,
  id,
  name,
  disabled = false,
  className,
  style,
  ...props
}: InputProps) {
  const fieldId = id ?? (name ? `input-${name}` : undefined);
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

      <input
        id={fieldId}
        name={name}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={describedById}
        className={cn(
          "w-full bg-background text-foreground placeholder:text-muted-foreground",
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
      />

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
