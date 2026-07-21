"use client";

import type { InventoryStatus } from "@/features/inventory/types";
import { useT } from "@/i18n";
import { Badge } from "@/shared/ui/Badge";

const VARIANTS: Record<InventoryStatus, "primary" | "secondary"> = {
  not_tracked: "secondary",
  in_stock: "primary",
  low_stock: "secondary",
  out_of_stock: "secondary",
};

type StockStatusBadgeProps = {
  status: InventoryStatus;
};

/**
 * Admin badge for inventory status (RFC-023 / ADR-021).
 */
export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const t = useT();

  return (
    <Badge variant={VARIANTS[status]}>
      {t(`inventory.status.${status}`)}
    </Badge>
  );
}
