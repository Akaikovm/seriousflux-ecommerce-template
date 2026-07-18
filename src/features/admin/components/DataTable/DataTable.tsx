import type { ReactNode } from "react";

import type { AdminDataTableColumn } from "@/features/admin/types";
import { EmptyState } from "@/shared/ui/EmptyState";
import { LoadingState } from "@/shared/ui/LoadingState";
import { cn } from "@/lib/utils";

type DataTableProps<T> = {
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  /** Reserved for future pagination controls. */
  footer?: ReactNode;
  className?: string;
};

/**
 * Reusable typed admin data table (RFC-011 / ADR-021).
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading = false,
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
      <div className={cn("admin-table admin-table__empty", className)}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className={cn("admin-table", className)}>
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
    </div>
  );
}
