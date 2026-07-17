"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/auth/providers";
import { LoadingState } from "@/shared/ui/LoadingState";

type RequireAuthProps = {
  children: ReactNode;
  /** Where to send unauthenticated users. Defaults to `/admin/login`. */
  redirectTo?: string;
};

/**
 * Client auth guard for admin routes (RFC-011).
 *
 * Any authenticated Firebase user may pass. Role-based checks come later.
 * Shows a loading skeleton until auth state resolves.
 */
export function RequireAuth({
  children,
  redirectTo = "/admin/login",
}: RequireAuthProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col justify-center gap-3 py-8">
        <LoadingState width="100%" height="2.75rem" />
        <LoadingState width="100%" height="2.75rem" />
        <LoadingState width="70%" height="2.75rem" />
      </div>
    );
  }

  if (!user) {
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
