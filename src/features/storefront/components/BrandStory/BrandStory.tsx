import Link from "next/link";

import { BrandLockup } from "@/features/storefront/components/BrandLockup";
import { Section } from "@/features/storefront/components/Section";
import { cn } from "@/lib/utils";
import { radius, spacing, transition, typography } from "@/shared/design/tokens";

type BrandStoryProps = {
  storeName: string;
  logo: string;
  tagline: string;
  description: string;
  /** Optional CTA — defaults to featured products. */
  ctaText?: string;
  ctaHref?: string;
  className?: string;
};

/**
 * Brand story strip — identity presence below the catalog.
 *
 * Driven entirely by StoreSettings (name, logo, tagline, description).
 * Renders nothing when there is no story copy yet.
 */
export function BrandStory({
  storeName,
  logo,
  tagline,
  description,
  ctaText = "Explore the shop",
  ctaHref = "/#featured",
  className,
}: BrandStoryProps) {
  const story = description.trim() || tagline.trim();
  if (!story) {
    return null;
  }

  const headline = tagline.trim() || `About ${storeName}`;
  const body = description.trim();

  return (
    <Section
      id="about"
      className={cn(
        "scroll-mt-[var(--storefront-navbar-height)] !py-[var(--storefront-section-py-lg)]",
        className,
      )}
      aria-labelledby="brand-story-title"
    >
      <div className="storefront-container">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <div
              className="relative flex min-h-[14rem] items-center justify-center overflow-hidden sm:min-h-[18rem] lg:min-h-[22rem]"
              style={{
                borderRadius: radius["2xl"],
                backgroundImage: `
                  radial-gradient(
                    ellipse 70% 60% at 30% 40%,
                    color-mix(in oklab, var(--brand-accent) 18%, transparent),
                    transparent 65%
                  ),
                  linear-gradient(
                    145deg,
                    color-mix(in oklab, var(--muted) 90%, var(--primary)) 0%,
                    color-mix(in oklab, var(--primary) 12%, var(--muted)) 100%
                  )
                `,
              }}
            >
              <BrandLockup
                storeName={storeName}
                logo={logo}
                size="story"
                showName={!logo.trim()}
                className="px-8"
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-7">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Our story
            </p>
            <h2
              id="brand-story-title"
              className="storefront-heading text-[clamp(1.75rem,4vw,2.75rem)] text-foreground text-balance"
            >
              {headline}
            </h2>
            {body && body !== headline ? (
              <p
                className="max-w-xl text-base text-muted-foreground sm:text-lg"
                style={{ lineHeight: typography.lineHeight.relaxed }}
              >
                {body}
              </p>
            ) : null}
            <div style={{ paddingTop: spacing.xs }}>
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{
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
        </div>
      </div>
    </Section>
  );
}
