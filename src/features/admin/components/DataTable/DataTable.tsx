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
 * Reusable typed admin data table (RFC-011).
 *
 * Supports loading / empty states and a footer slot for future pagination.
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
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <LoadingState height="2.5rem" />
        <LoadingState height="2.5rem" />
        <LoadingState height="2.5rem" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm sm:min-w-[40rem]">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn(
                    "px-2.5 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:px-3 sm:py-2.5",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowId(row)}
                className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/35"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-2.5 py-2 align-middle sm:px-3 sm:py-2.5",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer ? (
        <div className="border-t border-border px-3 py-2.5 text-sm text-muted-foreground sm:px-4 sm:py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
