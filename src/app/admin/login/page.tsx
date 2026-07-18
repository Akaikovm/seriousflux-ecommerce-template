import type { Metadata } from "next";

import { AdminLoginForm } from "@/features/auth/components";

import "@/features/admin/styles/tokens.css";
import "@/features/admin/styles/admin.css";
import "@/features/admin/styles/admin-ui.css";

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
    <div className="admin-login">
      <AdminLoginForm />
    </div>
  );
}
