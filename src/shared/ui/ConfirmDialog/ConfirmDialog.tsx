"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  radius,
  shadow,
  spacing,
  typography,
  zIndex,
} from "@/shared/design/tokens";
import { Button } from "@/shared/ui/Button";

/**
 * Design System ConfirmDialog — reusable confirmation overlay.
 *
 * Controlled component. Use instead of `window.confirm()`.
 */

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** When true, confirm button shows loading and both actions are blocked. */
  loading?: boolean;
  /** Destructive styling cue for irreversible actions. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="admin-dialog-backdrop absolute inset-0 bg-foreground/40"
        disabled={loading}
        onClick={() => {
          if (!loading) {
            onCancel();
          }
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="admin-dialog-panel relative mx-auto w-full max-w-[min(28rem,calc(100vw-2rem))] border border-border bg-card text-card-foreground"
        style={{
          borderRadius: radius.lg,
          boxShadow: shadow.lg,
          padding: spacing.xl,
        }}
      >
        <h2
          id={titleId}
          className="text-foreground"
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          {title}
        </h2>

        {description ? (
          <p
            id={descriptionId}
            className="mt-2 text-muted-foreground"
            style={{
              fontSize: typography.fontSize.sm,
              lineHeight: typography.lineHeight.normal,
            }}
          >
            {description}
          </p>
        ) : null}

        <div
          className="mt-6 flex flex-wrap justify-end gap-2"
          style={{ gap: spacing.sm }}
        >
          <Button
            ref={cancelRef}
            type="button"
            disabled={loading}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            loading={loading}
            className={cn(
              destructive &&
                "bg-destructive text-white hover:bg-destructive/90",
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
