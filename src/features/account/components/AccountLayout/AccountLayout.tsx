"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { getEnabledAccountNavItems } from "@/features/account/config/nav";
import { useAuth } from "@/features/auth/providers";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/Button";

type AccountLayoutProps = {
  children: ReactNode;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/account") {
    return pathname === "/account";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Shared Account shell — config-driven sidebar + content (RFC-018).
 */
export function AccountLayoutShell({ children }: AccountLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const navItems = getEnabledAccountNavItems();

  async function handleLogout() {
    if (signingOut) {
      return;
    }
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="storefront-container py-10 sm:py-12">
      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
        <aside className="flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              My Account
            </p>
            <nav
              className="mt-4 flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1"
              aria-label="Account"
            >
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Button
            type="button"
            loading={signingOut}
            onClick={() => {
              void handleLogout();
            }}
            className="w-full max-w-[12rem] bg-transparent text-foreground ring-1 ring-border hover:bg-muted"
          >
            Logout
          </Button>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
