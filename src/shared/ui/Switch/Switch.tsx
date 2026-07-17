import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

/**
 * Design System Switch — labeled boolean toggle.
 * Presentation only. No validation logic.
 */

type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "children"
> & {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  id?: string;
};

export function Switch({
  label,
  helperText,
  error,
  id,
  name,
  disabled = false,
  checked = false,
  className,
  ...props
}: SwitchProps) {
  const fieldId = id ?? (name ? `switch-${name}` : undefined);
  const describedById = fieldId
    ? error
      ? `${fieldId}-error`
      : helperText
        ? `${fieldId}-helper`
        : undefined
    : undefined;
  const hasError = Boolean(error);
  const isOn = Boolean(checked);

  return (
    <div className="flex w-full flex-col" style={{ gap: spacing.sm }}>
      <label
        htmlFor={fieldId}
        className={cn(
          "inline-flex items-center gap-3 text-foreground",
          disabled && "cursor-not-allowed opacity-50",
          !disabled && "cursor-pointer",
          className,
        )}
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          lineHeight: typography.lineHeight.tight,
        }}
      >
        <span className="relative inline-flex shrink-0">
          <input
            id={fieldId}
            name={name}
            type="checkbox"
            role="switch"
            disabled={disabled}
            checked={checked}
            aria-checked={isOn}
            aria-invalid={hasError || undefined}
            aria-describedby={describedById}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden
            className={cn(
              "block h-6 w-11 border",
              isOn ? "border-primary bg-primary" : "border-input bg-muted",
            )}
            style={{
              borderRadius: radius.full,
              transitionProperty: "background-color, border-color",
              transitionDuration: transition.fast,
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-0.5 left-0.5 size-5 bg-background shadow-sm"
            style={{
              borderRadius: radius.full,
              transform: isOn ? "translateX(1.25rem)" : "translateX(0)",
              transitionProperty: "transform",
              transitionDuration: transition.fast,
            }}
          />
        </span>
        {label ? <span>{label}</span> : null}
      </label>

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
