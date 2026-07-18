"use client";

import type { ReactNode } from "react";

import { useRequireAuth } from "@/features/auth/hooks/useRequireAuth";
import { LoadingState } from "@/shared/ui/LoadingState";

type RequireAuthProps = {
  children: ReactNode;
  /** Where to send unauthenticated users. Defaults to `/login`. */
  redirectTo?: string;
};

/**
 * Client guard: requires any authenticated session (RFC-017).
 * Does not check role — use RequireRole for admin.
 */
export function RequireAuth({
  children,
  redirectTo = "/login",
}: RequireAuthProps) {
  const { ready } = useRequireAuth(redirectTo);

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
