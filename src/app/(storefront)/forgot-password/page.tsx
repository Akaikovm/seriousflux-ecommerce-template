import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components";
import { RequireGuest } from "@/features/auth/guards";

export const metadata: Metadata = {
  title: "Reset password",
};

/**
 * Storefront forgot password — `/forgot-password` (RFC-017).
 */
export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <RequireGuest>
        <ForgotPasswordForm />
      </RequireGuest>
    </div>
  );
}
