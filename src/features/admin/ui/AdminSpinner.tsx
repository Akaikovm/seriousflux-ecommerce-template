"use client";

import { Loader2 } from "lucide-react";

import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

type AdminSpinnerProps = {
  className?: string;
  size?: "sm" | "md";
  label?: string;
};

/**
 * Brand-neutral Admin spinner (ADR-021).
 */
export function AdminSpinner({
  className,
  size = "md",
  label,
}: AdminSpinnerProps) {
  const t = useT();
  const resolvedLabel = label ?? t("admin.common.loading");

  return (
    <span
      className={cn(
        "admin-spinner",
        size === "sm" && "admin-spinner--sm",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={resolvedLabel}
    >
      <Loader2 className="admin-spinner__icon" aria-hidden />
      <span className="sr-only">{resolvedLabel}</span>
    </span>
  );
}
