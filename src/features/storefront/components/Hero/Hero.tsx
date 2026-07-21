"use client";

import Link from "next/link";

import type { ResolvedHeroContent } from "@/features/storefront/lib/resolve-hero-content";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  radius,
  spacing,
  transition,
  typography,
} from "@/shared/design/tokens";

type HeroProps = ResolvedHeroContent & {
  /** Store identity — always a hero-level brand signal. */
  storeName: string;
  className?: string;
};

/**
 * Configurable storefront hero.
 *
 * Content comes from StoreSettings via `resolveHeroContent`.
 * Full-bleed image when `image` is set; atmospheric text-led layout otherwise.
 * Brand name is always prominent; marketing title only when it differs.
 * No Firebase. No hardcoded brand colors.
 */
export function Hero({
  storeName,
  title,
  subtitle,
  image,
  ctaText,
  ctaHref,
  className,
}: HeroProps) {
  const t = useT();
  const brand = storeName.trim() || title.trim() || t("hero.defaultStore");
  const marketingTitle =
    title.trim() && title.trim().toLowerCase() !== brand.toLowerCase()
      ? title.trim()
      : "";
  const hasImage = image.trim().length > 0;

  const copy = (
    <div className="max-w-3xl space-y-5 text-balance">
      {marketingTitle ? (
        <>
          <p
            className={cn(
              "storefront-brand-mark storefront-rise text-[clamp(2.75rem,8vw,5.5rem)]",
              hasImage ? "text-white" : "text-foreground",
            )}
          >
            {brand}
          </p>
          <h1
            className={cn(
              "storefront-heading storefront-rise storefront-rise-delay-1 text-[clamp(1.35rem,3.5vw,2rem)] font-medium",
              hasImage ? "text-white/90" : "text-foreground/85",
            )}
            style={{
              lineHeight: typography.lineHeight.tight,
              letterSpacing: typography.letterSpacing.tight,
              fontWeight: typography.fontWeight.medium,
            }}
          >
            {marketingTitle}
          </h1>
        </>
      ) : (
        <h1
          className={cn(
            "storefront-brand-mark storefront-rise text-[clamp(2.75rem,8vw,5.5rem)]",
            hasImage ? "text-white" : "text-foreground",
          )}
        >
          {brand}
        </h1>
      )}

      {subtitle ? (
        <p
          className={cn(
            "storefront-rise storefront-rise-delay-2 max-w-xl text-base sm:text-lg",
            hasImage ? "text-white/80" : "text-muted-foreground",
          )}
          style={{ lineHeight: typography.lineHeight.relaxed }}
        >
          {subtitle}
        </p>
      ) : null}

      <div className="storefront-rise storefront-rise-delay-3" style={{ paddingTop: spacing.sm }}>
        <Link
          href={ctaHref}
          className={cn(
            "inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            hasImage
              ? "bg-white text-foreground hover:bg-white/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          style={{
            gap: spacing.sm,
            paddingBlock: spacing.md,
            paddingInline: spacing["2xl"],
            borderRadius: radius.md,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            letterSpacing: typography.letterSpacing.wide,
            transitionDuration: transition.normal,
          }}
        >
          {ctaText}
        </Link>
      </div>
    </div>
  );

  if (hasImage) {
    return (
      <section
        className={cn("relative w-full overflow-hidden", className)}
        style={{ minHeight: "var(--storefront-hero-min-h)" }}
        aria-label={t("hero.ariaLabel")}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client */}
        <img
          src={image}
          alt=""
          className="storefront-fade-in absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0 bg-linear-to-t from-black/75 via-black/35 to-black/15"
          aria-hidden
        />
        <div className="storefront-container relative flex min-h-[inherit] flex-col justify-end pb-14 pt-28 sm:pb-20 sm:pt-36">
          {copy}
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "storefront-section-lg relative w-full overflow-hidden border-b border-border",
        className,
      )}
      style={{ minHeight: "var(--storefront-hero-min-h)" }}
      aria-label={t("hero.ariaLabel")}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 70% 55% at 15% 30%, color-mix(in oklab, var(--brand-accent) 22%, transparent), transparent 60%),
            radial-gradient(ellipse 55% 45% at 85% 70%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 55%),
            linear-gradient(160deg, color-mix(in oklab, var(--muted) 80%, transparent) 0%, transparent 55%)
          `,
        }}
        aria-hidden
      />
      <div className="storefront-container relative flex min-h-[inherit] flex-col justify-center py-20 sm:py-28">
        {copy}
      </div>
    </section>
  );
}
