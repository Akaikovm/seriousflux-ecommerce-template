import type { Metadata } from "next";

import { AdminLoginForm } from "@/features/auth/components";

export const metadata: Metadata = {
  title: "Sign in",
};

/**
 * Admin login route — `/admin/login`.
 *
 * Outside the protected dashboard shell so unauthenticated users can sign in.
 */
export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <AdminLoginForm />
    </div>
  );
}
