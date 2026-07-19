"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { CircleHelp } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { radius, spacing, typography } from "@/shared/design/tokens";

type InfoTooltipProps = {
  /** Short help shown on hover / focus (keep to 1–2 sentences). */
  content: ReactNode;
  /** Accessible name for the trigger button. */
  label?: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
};

/**
 * Compact “?” hint next to form labels.
 * Uses Base UI Tooltip — Design System primitive (ADR-001).
 */
export function InfoTooltip({
  content,
  label = "More information",
  side = "top",
  className,
}: InfoTooltipProps) {
  return (
    <BaseTooltip.Provider>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger
          type="button"
          delay={200}
          closeDelay={0}
          aria-label={label}
          className={cn(
            "inline-flex size-4 shrink-0 items-center justify-center",
            "rounded-full text-muted-foreground transition-colors",
            "hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          onClick={(event) => {
            // Avoid toggling a parent Switch <label>.
            event.preventDefault();
            event.stopPropagation();
          }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <CircleHelp className="size-3.5" aria-hidden />
        </BaseTooltip.Trigger>
        <BaseTooltip.Portal>
          <BaseTooltip.Positioner side={side} sideOffset={6}>
            <BaseTooltip.Popup
              className="z-50 max-w-[16rem] border border-border bg-popover text-popover-foreground shadow-md"
              style={{
                borderRadius: radius.md,
                paddingBlock: spacing.sm,
                paddingInline: spacing.md,
                fontSize: typography.fontSize.xs,
                lineHeight: typography.lineHeight.normal,
              }}
            >
              {content}
            </BaseTooltip.Popup>
          </BaseTooltip.Positioner>
        </BaseTooltip.Portal>
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}

type LabelWithHintProps = {
  children: ReactNode;
  hint: ReactNode;
  hintLabel?: string;
};

/**
 * Label text + info icon for dense Admin forms.
 */
export function LabelWithHint({
  children,
  hint,
  hintLabel,
}: LabelWithHintProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{children}</span>
      <InfoTooltip content={hint} label={hintLabel} />
    </span>
  );
}
