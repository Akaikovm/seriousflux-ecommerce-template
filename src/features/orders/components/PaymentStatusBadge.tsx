import { getPaymentStatusLabel } from "@/features/orders/lib/order-status";
import type { OrderPaymentStatus } from "@/features/orders/types";
import { Badge } from "@/shared/ui/Badge";

type PaymentStatusBadgeProps = {
  status: OrderPaymentStatus;
  className?: string;
};

/**
 * Payment status chip — domain wrapper over Design System Badge.
 */
export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  const variant = status === "paid" ? "primary" : "secondary";

  return (
    <Badge variant={variant} className={className}>
      {getPaymentStatusLabel(status)}
    </Badge>
  );
}
