"use client";

import { Menu, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CartLink } from "@/features/cart/components/CartLink";
import type { StorefrontNavLink } from "@/features/storefront/types/storefront";
import { cn } from "@/lib/utils";
import { radius, spacing, transition, zIndex } from "@/shared/design/tokens";

type NavbarProps = {
  storeName: string;
  logo: string;
  navLinks: StorefrontNavLink[];
};

/**
 * Storefront navbar — logo, nav, cart, account placeholder.
 *
 * Client island for mobile menu only. No data fetching. No Firebase.
 */
export function Navbar({ storeName, logo, navLinks }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ zIndex: zIndex.sticky }}
    >
      <div
        className="storefront-container flex items-center justify-between gap-4"
        style={{ minHeight: "var(--storefront-navbar-height)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center text-foreground md:hidden"
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

          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${storeName} home`}
            onClick={() => setOpen(false)}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote logo hosts vary per client
              <img src={logo} alt="" className="h-8 w-8 object-contain" />
            ) : (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center bg-muted text-sm font-medium text-muted-foreground"
                aria-hidden
              >
                {storeName.charAt(0).toUpperCase() || "S"}
              </div>
            )}
            <p className="truncate text-base font-semibold tracking-tight">
              {storeName}
            </p>
          </Link>
        </div>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ transitionDuration: transition.fast }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
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
          "border-t border-border bg-background md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav
          className="storefront-container flex flex-col py-4"
          style={{ gap: spacing.sm }}
          aria-label="Mobile"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="py-2 text-base font-medium text-foreground"
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
