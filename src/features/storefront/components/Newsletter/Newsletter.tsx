"use client";

import { useState, type FormEvent } from "react";

import { Section } from "@/features/storefront/components/Section";
import type { NewsletterCopy } from "@/features/storefront/types/storefront";
import { cn } from "@/lib/utils";
import { spacing, typography } from "@/shared/design/tokens";
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
      className={cn("bg-primary text-primary-foreground", className)}
      aria-labelledby="newsletter-title"
    >
      <div className="storefront-container">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <h2
            id="newsletter-title"
            className="font-semibold tracking-tight"
            style={{
              fontSize: typography.fontSize["2xl"],
              lineHeight: typography.lineHeight.tight,
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className="mt-2 opacity-90"
              style={{
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              {subtitle}
            </p>
          ) : null}

          <form
            className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-start"
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
            <p
              className="mt-4 text-sm opacity-90"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
