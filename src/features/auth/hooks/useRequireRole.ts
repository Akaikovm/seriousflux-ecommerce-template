"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { PersistedRole } from "@/features/auth/types";

type UseRequireRoleOptions = {
  roles: readonly PersistedRole[];
  /** Where to send unauthorized users. Defaults to `/login`. */
  redirectTo?: string;
};

/**
 * Requires an authenticated user whose role is in `roles` and status is `active`.
 * Inactive admin/staff are denied even if the role matches.
 */
export function useRequireRole({
  roles,
  redirectTo = "/login",
}: UseRequireRoleOptions): {
  ready: boolean;
} {
  const { user, role, status, loading } = useCurrentUser();
  const router = useRouter();

  const allowed =
    user !== null &&
    status === "active" &&
    roles.includes(role as PersistedRole);

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace(redirectTo);
    }
  }, [loading, allowed, router, redirectTo]);

  return { ready: !loading && allowed };
}
