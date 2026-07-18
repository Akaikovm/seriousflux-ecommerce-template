import type { ReactNode } from "react";

import { AccountAuthLayout } from "@/features/account/components/AccountAuthLayout";

/**
 * Account route group layout — auth required + shared sidebar.
 */
export default function AccountLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AccountAuthLayout>{children}</AccountAuthLayout>;
}
