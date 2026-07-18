import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type AdminBackLinkProps = {
  href: string;
  children: string;
  className?: string;
};

/**
 * Consistent back navigation for Admin create/edit pages.
 */
export function AdminBackLink({ href, children, className }: AdminBackLinkProps) {
  return (
    <Link href={href} className={cn("admin-back-link", className)}>
      <ArrowLeft className="size-3.5" aria-hidden />
      {children}
    </Link>
  );
}
