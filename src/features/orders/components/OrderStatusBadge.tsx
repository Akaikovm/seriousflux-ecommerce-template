import {
  getOrderStatusLabel,
  normalizeOrderStatus,
} from "@/features/orders/lib/order-status";
import type { OrderStatus } from "@/features/orders/types";
import { Badge } from "@/shared/ui/Badge";

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

/**
 * Fulfillment status chip — domain wrapper over Design System Badge.
 */
export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const canonical = normalizeOrderStatus(status);
  const variant =
    canonical === "cancelled"
      ? "secondary"
      : canonical === "completed"
        ? "primary"
        : "secondary";

  return (
    <Badge variant={variant} className={className}>
      {getOrderStatusLabel(status)}
    </Badge>
  );
}
