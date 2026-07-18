import Link from "next/link";

import { EmptyState } from "@/shared/ui/EmptyState";
import { Button } from "@/shared/ui/Button";

/**
 * Admin customer not found — `/admin/customers/[customerId]`.
 */
export default function AdminCustomerNotFound() {
  return (
    <EmptyState
      title="Customer not found"
      description="This customer does not exist or could not be loaded."
      action={
        <Link href="/admin/customers">
          <Button type="button">Back to customers</Button>
        </Link>
      }
    />
  );
}
