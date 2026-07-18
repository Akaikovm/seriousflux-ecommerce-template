"use client";

import type { ReactNode } from "react";

import { useRequireGuest } from "@/features/auth/hooks/useRequireGuest";
import { LoadingState } from "@/shared/ui/LoadingState";

type RequireGuestProps = {
  children: ReactNode;
  /** Where to send authenticated users. Defaults to `/`. */
  redirectTo?: string;
};

/**
 * Client guard: guest-only routes (login / signup / forgot-password).
 */
export function RequireGuest({
  children,
  redirectTo = "/",
}: RequireGuestProps) {
  const { ready } = useRequireGuest(redirectTo);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col justify-center gap-3 py-8">
        <LoadingState width="100%" height="2.75rem" />
        <LoadingState width="12rem" height="2.5rem" />
      </div>
    );
  }

  return <>{children}</>;
}
