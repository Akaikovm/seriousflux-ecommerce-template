import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components";
import { RequireGuest } from "@/features/auth/guards";
import { sanitizeRedirectTo } from "@/features/auth/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string }>;
};

/**
 * Storefront login — `/login` (RFC-017 / RFC-018).
 * Honors `?redirectTo=` for Account, Checkout, and deep links.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = sanitizeRedirectTo(params.redirectTo, "/account");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <RequireGuest redirectTo={redirectTo}>
        <LoginForm redirectTo={redirectTo} />
      </RequireGuest>
    </div>
  );
}
