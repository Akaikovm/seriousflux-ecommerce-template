import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

/**
 * Design System Button — primary variant only.
 *
 * Intentionally small API: disabled, loading, fullWidth.
 * No icons yet. Additional variants belong in a later RFC.
 */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** Shows a spinner and blocks interaction while true. */
  loading?: boolean;
  /** Stretches the button to 100% of its parent width. */
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className,
      type = "button",
      disabled = false,
      loading = false,
      fullWidth = false,
      style,
      ...props
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center bg-primary text-primary-foreground",
          "hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        style={{
          width: fullWidth ? "100%" : undefined,
          gap: spacing.sm,
          paddingBlock: spacing.sm,
          paddingInline: spacing.lg,
          borderRadius: radius.md,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          lineHeight: typography.lineHeight.tight,
          transitionProperty: "color, background-color, opacity",
          transitionDuration: transition.fast,
          ...style,
        }}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden
            className="inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
            style={{
              width: spacing.lg,
              height: spacing.lg,
            }}
          />
        ) : null}
        {children}
      </button>
    );
  },
);
