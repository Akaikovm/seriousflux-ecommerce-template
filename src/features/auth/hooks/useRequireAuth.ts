"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

/**
 * Redirects unauthenticated users to `redirectTo` (default `/login`).
 */
export function useRequireAuth(redirectTo = "/login"): {
  ready: boolean;
} {
  const { user, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  return { ready: !loading && user !== null };
}
