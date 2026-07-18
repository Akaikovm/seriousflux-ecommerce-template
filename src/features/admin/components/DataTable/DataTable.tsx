import type { ReactNode } from "react";

import type { AdminDataTableColumn } from "@/features/admin/types";
import { AdminSpinner } from "@/features/admin/ui/AdminSpinner";
import { EmptyState } from "@/shared/ui/EmptyState";
import { LoadingState } from "@/shared/ui/LoadingState";
import { cn } from "@/lib/utils";

type DataTableProps<T> = {
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  /**
   * Soft in-table pending (filter/pagination refresh).
   * Keeps rows visible with a centered spinner — not a full-page block.
   */
  pending?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Reserved for future pagination controls. */
  footer?: ReactNode;
  className?: string;
};

function TablePendingOverlay({ label }: { label: string }) {
  return (
    <div className="admin-table__pending" role="status" aria-live="polite">
      <AdminSpinner label={label} />
    </div>
  );
}

/**
 * Reusable typed admin data table (RFC-011 / ADR-021).
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
  pending = false,
  emptyTitle = "No results",
  emptyDescription,
  emptyAction,
  footer,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={cn("admin-table admin-table__loading", className)}>
        <LoadingState height="2.5rem" />
        <LoadingState height="2.5rem" />
        <LoadingState height="2.5rem" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "admin-table admin-table__empty",
          pending && "admin-table--pending",
          className,
        )}
        aria-busy={pending}
      >
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
        {pending ? <TablePendingOverlay label="Updating results" /> : null}
      </div>
    );
  }

  return (
    <div
      className={cn("admin-table", pending && "admin-table--pending", className)}
      aria-busy={pending}
    >
      <div className="admin-table__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.id} scope="col" className={column.className}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowId(row)}>
                {columns.map((column) => (
                  <td key={column.id} className={column.className}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer ? <div className="admin-table__footer">{footer}</div> : null}
      {pending ? <TablePendingOverlay label="Updating results" /> : null}
    </div>
  );
}
