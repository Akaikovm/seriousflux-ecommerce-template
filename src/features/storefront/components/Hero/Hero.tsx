import Link from "next/link";

import type { ResolvedHeroContent } from "@/features/storefront/lib/resolve-hero-content";
import { cn } from "@/lib/utils";
import {
  radius,
  spacing,
  transition,
  typography,
} from "@/shared/design/tokens";

type HeroProps = ResolvedHeroContent & {
  className?: string;
};

/**
 * Configurable storefront hero.
 *
 * Content comes from StoreSettings via `resolveHeroContent`.
 * Full-bleed image when `image` is set; elegant text-led layout otherwise.
 * No Firebase. No hardcoded brand values.
 */
export function Hero({
  title,
  subtitle,
  image,
  ctaText,
  ctaHref,
  className,
}: HeroProps) {
  const hasImage = image.trim().length > 0;

  if (hasImage) {
    return (
      <section
        className={cn("relative w-full overflow-hidden", className)}
        style={{ minHeight: "var(--storefront-hero-min-h)" }}
        aria-label="Hero"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client */}
        <img
          src={image}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20"
          aria-hidden
        />
        <div className="storefront-container relative flex min-h-[inherit] flex-col justify-end pb-12 pt-24 sm:pb-16 sm:pt-32">
          <div className="max-w-2xl space-y-5 text-white">
            <h1
              className="font-semibold tracking-tight text-balance"
              style={{
                fontSize: typography.fontSize["5xl"],
                lineHeight: typography.lineHeight.tight,
                letterSpacing: typography.letterSpacing.tight,
              }}
            >
              <span className="block text-[clamp(2.25rem,6vw,3.75rem)]">
                {title}
              </span>
            </h1>
            {subtitle ? (
              <p className="max-w-xl text-base text-white/85 sm:text-lg">
                {subtitle}
              </p>
            ) : null}
            <div style={{ paddingTop: spacing.sm }}>
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{
                  gap: spacing.sm,
                  paddingBlock: spacing.md,
                  paddingInline: spacing.xl,
                  borderRadius: radius.md,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  transitionDuration: transition.fast,
                }}
              >
                {ctaText}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "storefront-section-lg relative w-full border-b border-border bg-muted/30",
        className,
      )}
      style={{ minHeight: "var(--storefront-hero-min-h)" }}
      aria-label="Hero"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 10% 20%, var(--brand-accent) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 90% 80%, var(--primary) 0%, transparent 50%)",
          opacity: 0.08,
        }}
        aria-hidden
      />
      <div className="storefront-container relative flex min-h-[inherit] flex-col justify-center py-16 sm:py-24">
        <div className="max-w-2xl space-y-6">
          <h1
            className="font-semibold tracking-tight text-foreground text-balance"
            style={{
              lineHeight: typography.lineHeight.tight,
              letterSpacing: typography.letterSpacing.tight,
            }}
          >
            <span className="block text-[clamp(2.5rem,7vw,3.75rem)]">
              {title}
            </span>
          </h1>
          {subtitle ? (
            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              {subtitle}
            </p>
          ) : null}
          <div style={{ paddingTop: spacing.sm }}>
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{
                gap: spacing.sm,
                paddingBlock: spacing.md,
                paddingInline: spacing.xl,
                borderRadius: radius.md,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                transitionDuration: transition.fast,
              }}
            >
              {ctaText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
