"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthError } from "@/features/auth/services";
import { useAuth } from "@/features/auth/providers";
import { sanitizeRedirectTo } from "@/features/auth/lib/safe-redirect";
import { requestNotification } from "@/features/notifications";
import { translateAuthError, useT } from "@/i18n";
import { Button } from "@/shared/ui/Button";

type GoogleAuthButtonProps = {
  /** Button label. Defaults to localized auth.continueWithGoogle. */
  label?: string;
  /**
   * Where to navigate after success.
   * When `navigate` is false, stays on the current page (Checkout in-place).
   */
  redirectTo?: string;
  /** When false, does not navigate after success (default true). */
  navigate?: boolean;
  /** Called after a successful Google session is established. */
  onSuccess?: () => void;
  /** Called with an error message when sign-in fails (except popup cancel). */
  onError?: (message: string) => void;
  fullWidth?: boolean;
  className?: string;
};

/**
 * One-click Google sign-in / sign-up (RFC-018).
 * Uses AuthProvider only — never Firebase Auth directly.
 */
export function GoogleAuthButton({
  label,
  redirectTo = "/account",
  navigate = true,
  onSuccess,
  onError,
  fullWidth = true,
  className,
}: GoogleAuthButtonProps) {
  const t = useT();
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const session = await signInWithGoogle();
      if (session.isNewCustomer && session.user.email) {
        requestNotification({
          event: "account.welcome",
          email: session.user.email,
          displayName: session.user.displayName ?? undefined,
          customerId: session.customerId,
        });
      }
      onSuccess?.();
      if (navigate) {
        router.replace(sanitizeRedirectTo(redirectTo, "/account"));
      }
    } catch (err) {
      if (err instanceof AuthError && err.code === "popup-closed") {
        return;
      }
      const message =
        err instanceof AuthError
          ? translateAuthError(err, t)
          : t("auth.googleFailed");
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      loading={loading}
      fullWidth={fullWidth}
      className={className}
      onClick={() => {
        void handleClick();
      }}
    >
      {label ?? t("auth.continueWithGoogle")}
    </Button>
  );
}
