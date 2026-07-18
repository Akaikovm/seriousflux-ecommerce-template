import type { Metadata } from "next";

import { AccountProfileForm } from "@/features/account/components";

export const metadata: Metadata = {
  title: "Profile",
};

/**
 * Account profile — `/account/profile` (RFC-018).
 */
export default function AccountProfilePage() {
  return <AccountProfileForm />;
}
