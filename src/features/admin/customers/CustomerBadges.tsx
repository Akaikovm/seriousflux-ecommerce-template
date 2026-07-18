import type { PersistedRole, UserStatus } from "@/features/auth/types";
import {
  getCustomerRoleLabel,
  getCustomerStatusLabel,
} from "@/features/admin/customers/admin-customer-view";
import { Badge } from "@/shared/ui/Badge";
import { cn } from "@/lib/utils";

type CustomerRoleBadgeProps = {
  role: PersistedRole;
  className?: string;
};

export function CustomerRoleBadge({ role, className }: CustomerRoleBadgeProps) {
  return (
    <Badge
      variant={role === "admin" ? "primary" : "secondary"}
      className={className}
    >
      {getCustomerRoleLabel(role)}
    </Badge>
  );
}

type CustomerStatusBadgeProps = {
  status: UserStatus;
  className?: string;
};

export function CustomerStatusBadge({
  status,
  className,
}: CustomerStatusBadgeProps) {
  return (
    <Badge
      variant={status === "active" ? "primary" : "secondary"}
      className={cn(status === "inactive" && "opacity-80", className)}
    >
      {getCustomerStatusLabel(status)}
    </Badge>
  );
}
