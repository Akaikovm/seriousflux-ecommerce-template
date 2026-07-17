import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { radius, spacing, transition } from "@/shared/design/tokens";

/**
 * Design System LoadingState — simple skeleton placeholder.
 *
 * No external skeleton libraries. Compose multiple instances for layouts.
 */

type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  /** Skeleton width (CSS length). Defaults to full width. */
  width?: string;
  /** Skeleton height (CSS length). Defaults to one text line. */
  height?: string;
};

export function LoadingState({
  className,
  width = "100%",
  height = spacing["2xl"],
  style,
  ...props
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={cn("animate-pulse bg-muted", className)}
      style={
        {
          width,
          height,
          borderRadius: radius.md,
          transitionDuration: transition.normal,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}
