"use client";

import { useT } from "@/i18n";
import { Button } from "@/shared/ui/Button";

type AdminSaveBarProps = {
  dirty: boolean;
  loading?: boolean;
  onDiscard: () => void;
  /** Defaults to form submit via type="submit". */
  saveLabel?: string;
  discardLabel?: string;
  statusLabel?: string;
};

/**
 * Floating sticky save chrome — visible only when dirty (ADR-021).
 */
export function AdminSaveBar({
  dirty,
  loading = false,
  onDiscard,
  saveLabel,
  discardLabel,
  statusLabel,
}: AdminSaveBarProps) {
  const t = useT();
  const resolvedSaveLabel = saveLabel ?? t("admin.common.saveChanges");
  const resolvedDiscardLabel = discardLabel ?? t("admin.common.discard");
  const resolvedStatusLabel = statusLabel ?? t("admin.ui.saveBarUnsaved");

  if (!dirty) {
    return null;
  }

  return (
    <div
      className="admin-savebar"
      role="region"
      aria-label={resolvedStatusLabel}
    >
      <div className="admin-savebar__panel">
        <p className="admin-savebar__status" role="status">
          <span className="admin-savebar__dot" aria-hidden />
          {resolvedStatusLabel}
        </p>
        <div className="admin-savebar__actions">
          <Button
            type="button"
            disabled={loading}
            className="admin-savebar__discard"
            onClick={onDiscard}
          >
            {resolvedDiscardLabel}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!dirty || loading}
            className="admin-savebar__save"
          >
            {resolvedSaveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
