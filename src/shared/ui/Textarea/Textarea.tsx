import type { ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

/**
 * Design System Textarea — multi-line text field.
 * Presentation only. No validation logic.
 */

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  id?: string;
};

export function Textarea({
  label,
  helperText,
  error,
  id,
  name,
  disabled = false,
  className,
  style,
  rows = 4,
  ...props
}: TextareaProps) {
  const fieldId = id ?? (name ? `textarea-${name}` : undefined);
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

      <textarea
        id={fieldId}
        name={name}
        disabled={disabled}
        rows={rows}
        aria-invalid={hasError || undefined}
        aria-describedby={describedById}
        className={cn(
          "w-full resize-y bg-background text-foreground placeholder:text-muted-foreground",
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
