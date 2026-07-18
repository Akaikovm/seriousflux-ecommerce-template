"use client";

import { Menu, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CartLink } from "@/features/cart/components/CartLink";
import { BrandLockup } from "@/features/storefront/components/BrandLockup";
import type { StorefrontNavLink } from "@/features/storefront/types/storefront";
import { cn } from "@/lib/utils";
import { radius, spacing, transition, zIndex } from "@/shared/design/tokens";

type NavbarProps = {
  storeName: string;
  logo: string;
  navLinks: StorefrontNavLink[];
};

/**
 * Storefront navbar — brand lockup, nav, cart, account placeholder.
 *
 * Client island for mobile menu only. No data fetching. No Firebase.
 */
export function Navbar({ storeName, logo, navLinks }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
      style={{ zIndex: zIndex.sticky }}
    >
      <div
        className="storefront-container flex items-center justify-between gap-4"
        style={{ minHeight: "var(--storefront-navbar-height)" }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center text-foreground lg:hidden"
            style={{
              width: spacing["2xl"],
              height: spacing["2xl"],
              borderRadius: radius.md,
            }}
            aria-expanded={open}
            aria-controls="storefront-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>

          <BrandLockup
            storeName={storeName}
            logo={logo}
            size="nav"
            href="/"
            onNavigate={() => setOpen(false)}
            className="min-w-0"
          />
        </div>

        <nav
          className="hidden items-center gap-9 lg:flex"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="storefront-nav-link text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ transitionDuration: transition.fast }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            className="hidden items-center justify-center text-muted-foreground sm:inline-flex"
            style={{
              width: spacing["2xl"],
              height: spacing["2xl"],
              borderRadius: radius.md,
            }}
            title="Account coming soon"
            aria-label="Account (coming soon)"
            role="img"
          >
            <User className="size-5" aria-hidden />
          </span>
          <CartLink />
        </div>
      </div>

      <div
        id="storefront-mobile-nav"
        className={cn(
          "border-t border-border/60 bg-background/95 lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav
          className="storefront-container flex flex-col py-5"
          style={{ gap: spacing.xs }}
          aria-label="Mobile"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="storefront-heading py-2.5 text-xl text-foreground"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <p className="py-2 text-sm text-muted-foreground">Account coming soon</p>
        </nav>
      </div>
    </header>
  );
}
