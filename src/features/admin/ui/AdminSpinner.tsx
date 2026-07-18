"use client";

import { Loader2 } from "lucide-react";

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
  label = "Loading",
}: AdminSpinnerProps) {
  return (
    <span
      className={cn(
        "admin-spinner",
        size === "sm" && "admin-spinner--sm",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2 className="admin-spinner__icon" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
