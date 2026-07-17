"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/shared/ui/Toast";

/**
 * Client island that mounts the shared Toast system for the storefront.
 * Reuses the same ToastProvider as Admin — no second notification stack.
 */
export function StorefrontToastProvider({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
