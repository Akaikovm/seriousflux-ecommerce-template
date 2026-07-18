"use client";

import type { ReactNode } from "react";

import { useRequireRole } from "@/features/auth/hooks/useRequireRole";
import type { PersistedRole } from "@/features/auth/types";
import { LoadingState } from "@/shared/ui/LoadingState";

type RequireRoleProps = {
  children: ReactNode;
  roles: readonly PersistedRole[];
  /** Where to send unauthorized users. Defaults to `/login`. */
  redirectTo?: string;
};

/**
 * Client guard: authenticated + role allow-list + status === active (RFC-017).
 *
 * Admin dashboard uses `roles={["admin"]}`. Authentication alone is not enough.
 */
export function RequireRole({
  children,
  roles,
  redirectTo = "/login",
}: RequireRoleProps) {
  const { ready } = useRequireRole({ roles, redirectTo });

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col justify-center gap-3 py-8">
        <LoadingState width="100%" height="2.75rem" />
        <LoadingState width="100%" height="2.75rem" />
        <LoadingState width="70%" height="2.75rem" />
      </div>
    );
  }

  return <>{children}</>;
}
