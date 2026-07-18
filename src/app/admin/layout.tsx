import type { Metadata } from "next";
import type { ReactNode } from "react";

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
 * Admin root layout (RFC-017).
 *
 * AuthProvider is mounted once at the application root — do not nest another.
 * Protected dashboard chrome lives in `(dashboard)/layout.tsx`.
 */
export default function AdminRootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
