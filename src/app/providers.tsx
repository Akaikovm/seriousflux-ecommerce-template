"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/providers";

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Root client providers (RFC-017).
 *
 * Mounts a single AuthProvider for storefront and admin — never duplicate.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
