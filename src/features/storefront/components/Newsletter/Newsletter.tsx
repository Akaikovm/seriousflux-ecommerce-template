"use client";

import { useState, type FormEvent } from "react";

import { Section } from "@/features/storefront/components/Section";
import type { NewsletterCopy } from "@/features/storefront/types/storefront";
import { cn } from "@/lib/utils";
import { radius, spacing, typography } from "@/shared/design/tokens";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";

type NewsletterProps = Partial<NewsletterCopy> & {
  className?: string;
};

const DEFAULTS: NewsletterCopy = {
  title: "Stay in the loop",
  subtitle: "New arrivals and exclusive offers, delivered to your inbox.",
  placeholder: "you@example.com",
  ctaText: "Subscribe",
  successMessage: "Thanks — you're on the list.",
};

/**
 * Presentational newsletter block.
 * No email backend — local success state only (RFC-010).
 */
export function Newsletter({
  title = DEFAULTS.title,
  subtitle = DEFAULTS.subtitle,
  placeholder = DEFAULTS.placeholder,
  ctaText = DEFAULTS.ctaText,
  successMessage = DEFAULTS.successMessage,
  className,
}: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();

    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address.");
      setSubmitted(false);
      return;
    }

    setError(null);
    setSubmitted(true);
    setEmail("");
  }

  return (
    <Section
      className={cn("relative overflow-hidden", className)}
      aria-labelledby="newsletter-title"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(
              135deg,
              color-mix(in oklab, var(--primary) 92%, black) 0%,
              color-mix(in oklab, var(--primary) 75%, var(--brand-accent)) 100%
            )
          `,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 20% 20%, color-mix(in oklab, white 18%, transparent), transparent 55%),
            radial-gradient(ellipse 50% 40% at 90% 80%, color-mix(in oklab, var(--brand-accent) 35%, transparent), transparent 50%)
          `,
        }}
        aria-hidden
      />

      <div className="storefront-container relative text-primary-foreground">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <h2
            id="newsletter-title"
            className="storefront-heading text-[clamp(1.75rem,4vw,2.5rem)]"
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className="mt-3 max-w-md opacity-90"
              style={{
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              {subtitle}
            </p>
          ) : null}

          <form
            className="mt-9 flex w-full flex-col gap-3 sm:flex-row sm:items-start"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="min-w-0 flex-1 text-left text-foreground">
              <Input
                name="newsletter-email"
                type="email"
                autoComplete="email"
                placeholder={placeholder}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSubmitted(false);
                  if (error) setError(null);
                }}
                error={error ?? undefined}
                aria-label="Email address"
                className="border-transparent bg-white/95 shadow-none"
                style={{ borderRadius: radius.md }}
              />
            </div>
            <Button
              type="submit"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:mt-0"
              style={{
                paddingBlock: spacing.sm,
                whiteSpace: "nowrap",
              }}
            >
              {ctaText}
            </Button>
          </form>

          {submitted ? (
            <p className="mt-4 text-sm opacity-90" role="status">
              {successMessage}
            </p>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
