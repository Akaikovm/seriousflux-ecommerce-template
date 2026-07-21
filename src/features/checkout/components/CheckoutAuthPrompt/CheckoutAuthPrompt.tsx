"use client";

import Link from "next/link";
import { useState } from "react";

import { GoogleAuthButton } from "@/features/auth/components";
import { useCurrentUser } from "@/features/auth/hooks";
import { buildLoginHref } from "@/features/auth/lib/safe-redirect";
import { useT } from "@/i18n";
import { LoadingState } from "@/shared/ui/LoadingState";

/**
 * Optional auth strip at the top of Checkout (RFC-018).
 * Guest checkout remains fully supported — this never blocks purchase.
 */
export function CheckoutAuthPrompt() {
  const t = useT();
  const { user, loading, isAuthenticated } = useCurrentUser();
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="mb-8" aria-busy="true">
        <LoadingState height="4.5rem" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="mb-8 border-b border-border/70 pb-6">
        <p className="text-sm text-muted-foreground">
          {t("checkout.signedInAs", {
            name: user.displayName || user.email || "",
          })}
        </p>
      </div>
    );
  }

  const loginHref = buildLoginHref("/checkout");

  return (
    <div className="mb-8 border-b border-border/70 pb-6">
      <p className="text-sm font-medium text-foreground">
        {t("auth.haveAccount")}
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:max-w-xs">
        <GoogleAuthButton
          redirectTo="/checkout"
          navigate={false}
          onError={setError}
        />
        <Link
          href={loginHref}
          className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-muted"
        >
          {t("checkout.authPromptSignIn")}
        </Link>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-sm text-muted-foreground">
        {t("checkout.authPromptOrGuest")}
      </p>
    </div>
  );
}
