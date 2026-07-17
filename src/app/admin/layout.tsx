import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/providers";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s · Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Admin root layout (RFC-011).
 *
 * Provides AuthProvider for all admin routes including login.
 * Protected dashboard chrome lives in `(dashboard)/layout.tsx`.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AuthProvider>{children}</AuthProvider>;
}
