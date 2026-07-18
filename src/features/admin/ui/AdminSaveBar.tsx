"use client";

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
  saveLabel = "Save changes",
  discardLabel = "Discard",
  statusLabel = "Unsaved changes",
}: AdminSaveBarProps) {
  if (!dirty) {
    return null;
  }

  return (
    <div
      className="admin-savebar"
      role="region"
      aria-label={statusLabel}
    >
      <div className="admin-savebar__panel">
        <p className="admin-savebar__status" role="status">
          <span className="admin-savebar__dot" aria-hidden />
          {statusLabel}
        </p>
        <div className="admin-savebar__actions">
          <Button
            type="button"
            disabled={loading}
            className="admin-savebar__discard"
            onClick={onDiscard}
          >
            {discardLabel}
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!dirty || loading}
            className="admin-savebar__save"
          >
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
