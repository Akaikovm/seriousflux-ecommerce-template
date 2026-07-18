import type { Metadata } from "next";

import { SignupForm } from "@/features/auth/components";
import { RequireGuest } from "@/features/auth/guards";
import { sanitizeRedirectTo } from "@/features/auth/lib/safe-redirect";

export const metadata: Metadata = {
  title: "Create account",
};

type SignupPageProps = {
  searchParams: Promise<{ redirectTo?: string }>;
};

/**
 * Storefront signup — `/signup` (RFC-017 / RFC-018).
 * Honors `?redirectTo=` (e.g. `/checkout`).
 */
export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const redirectTo = sanitizeRedirectTo(params.redirectTo, "/account");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <RequireGuest redirectTo={redirectTo}>
        <SignupForm redirectTo={redirectTo} />
      </RequireGuest>
    </div>
  );
}
