"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AccountLayoutShell } from "@/features/account/components";
import { RequireAuth } from "@/features/auth/guards";
import { buildLoginHref } from "@/features/auth/lib/safe-redirect";

type AccountAuthLayoutProps = {
  children: ReactNode;
};

/**
 * Client gate + Account shell for `/account/*` (RFC-018).
 * Guests redirect to `/login?redirectTo=<current-path>`.
 */
export function AccountAuthLayout({ children }: AccountAuthLayoutProps) {
  const pathname = usePathname();
  const loginHref = buildLoginHref(pathname || "/account");

  return (
    <RequireAuth redirectTo={loginHref}>
      <AccountLayoutShell>{children}</AccountLayoutShell>
    </RequireAuth>
  );
}
