"use client";

import { useAuth } from "@/features/auth/providers/AuthProvider";
import type { AppRole, AuthUser, UserStatus } from "@/features/auth/types";

export type CurrentUserValue = {
  user: AuthUser | null;
  role: AppRole;
  status: UserStatus | null;
  customerId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
};

/**
 * Primary identity hook for business features (RFC-017).
 * Never imports Firebase — consumes AuthProvider session only.
 */
export function useCurrentUser(): CurrentUserValue {
  const { user, role, status, customerId, loading } = useAuth();

  return {
    user,
    role,
    status,
    customerId,
    loading,
    isAuthenticated: user !== null,
    isGuest: !loading && user === null,
  };
}
