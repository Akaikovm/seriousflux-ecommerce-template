import { Badge } from "@/shared/ui/Badge";
import type { InventoryStatus } from "@/features/inventory/types";

const LABELS: Record<InventoryStatus, string> = {
  not_tracked: "Inventory disabled",
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

const VARIANTS: Record<
  InventoryStatus,
  "primary" | "secondary"
> = {
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
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
