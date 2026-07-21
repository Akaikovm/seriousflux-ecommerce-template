"use client";

import { Menu, User, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useCurrentUser } from "@/features/auth/hooks";
import { CartLink } from "@/features/cart/components/CartLink";
import { BrandLockup } from "@/features/storefront/components/BrandLockup";
import { LanguageSwitch } from "@/features/storefront/components/LanguageSwitch";
import type { StorefrontNavLink } from "@/features/storefront/types/storefront";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { radius, spacing, transition, zIndex } from "@/shared/design/tokens";
import { LoadingState } from "@/shared/ui/LoadingState";

type NavbarProps = {
  storeName: string;
  logo: string;
  navLinks: StorefrontNavLink[];
  /** When true, show ES | EN control (Admin → Settings → General). */
  allowLanguageSwitch?: boolean;
};

/**
 * Storefront navbar — brand lockup, nav, cart, Login / Account (RFC-018).
 *
 * Client island for mobile menu + auth-aware account link. No Firebase.
 */
export function Navbar({
  storeName,
  logo,
  navLinks,
  allowLanguageSwitch = false,
}: NavbarProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { isAuthenticated, loading } = useCurrentUser();

  const accountHref = isAuthenticated ? "/account" : "/login";
  const accountLabel = isAuthenticated ? t("nav.account") : t("nav.login");

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
            aria-label={open ? t("nav.closeMenu") : t("nav.openMenu")}
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
          aria-label={t("nav.primary")}
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
          {allowLanguageSwitch ? (
            <span className="hidden sm:inline-flex">
              <LanguageSwitch />
            </span>
          ) : null}
          {loading ? (
            <span className="hidden sm:inline-flex" aria-hidden>
              <LoadingState width="4rem" height="1.25rem" />
            </span>
          ) : (
            <Link
              href={accountHref}
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex sm:items-center sm:gap-1.5"
              style={{ transitionDuration: transition.fast }}
            >
              <User className="size-4" aria-hidden />
              {accountLabel}
            </Link>
          )}
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
          aria-label={t("nav.mobile")}
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
          {!loading ? (
            <Link
              href={accountHref}
              className="storefront-heading py-2.5 text-xl text-foreground"
              onClick={() => setOpen(false)}
            >
              {accountLabel}
            </Link>
          ) : null}
          {allowLanguageSwitch ? (
            <div className="py-2.5">
              <LanguageSwitch />
            </div>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
