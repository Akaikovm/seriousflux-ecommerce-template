import Link from "next/link";

import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";

/**
 * Admin order not found — `/admin/orders/[id]`.
 */
export default function AdminOrderNotFound() {
  return (
    <EmptyState
      title="Order not found"
      description="This order does not exist or could not be loaded."
      action={
        <Link href="/admin/orders">
          <Button type="button">Back to orders</Button>
        </Link>
      }
    />
  );
}
