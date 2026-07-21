import Link from "next/link";

import { BrandLockup } from "@/features/storefront/components/BrandLockup";
import type { StorefrontNavLink } from "@/features/storefront/types/storefront";
import { transition } from "@/shared/design/tokens";

export type FooterLabels = {
  shop: string;
  contact: string;
  follow: string;
  shippingAvailable: string;
  contactComingSoon: string;
  socialComingSoon: string;
  whatsapp: string;
  copyright: string;
};

type FooterProps = {
  storeName: string;
  logo?: string;
  description?: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  country: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  shippingEnabled: boolean;
  shopLinks: StorefrontNavLink[];
  labels: FooterLabels;
};

type SocialLink = {
  label: string;
  href: string;
};

function collectSocialLinks(links: {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
}): SocialLink[] {
  // Proper nouns — keep brand names untranslated.
  const entries: Array<[string, string]> = [
    ["Instagram", links.instagram],
    ["Facebook", links.facebook],
    ["TikTok", links.tiktok],
    ["YouTube", links.youtube],
  ];

  return entries
    .filter(([, href]) => href.trim().length > 0)
    .map(([label, href]) => ({ label, href: href.trim() }));
}

function whatsappHref(whatsapp: string): string {
  const value = whatsapp.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : value;
}

/**
 * Multi-column storefront footer — identity, shop links, contact, socials.
 * Presentational: settings fields + i18n labels passed from AppLayout.
 */
export function Footer({
  storeName,
  logo = "",
  description = "",
  email,
  phone,
  whatsapp,
  address,
  country,
  instagram,
  facebook,
  tiktok,
  youtube,
  shippingEnabled,
  shopLinks,
  labels,
}: FooterProps) {
  const socials = collectSocialLinks({ instagram, facebook, tiktok, youtube });
  const location = [address.trim(), country.trim()]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="relative w-full overflow-hidden border-t border-border/70">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(
              180deg,
              color-mix(in oklab, var(--muted) 45%, transparent) 0%,
              transparent 40%
            ),
            radial-gradient(
              ellipse 50% 40% at 100% 100%,
              color-mix(in oklab, var(--brand-accent) 10%, transparent),
              transparent 60%
            )
          `,
        }}
        aria-hidden
      />

      <div className="storefront-container relative grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <BrandLockup
            storeName={storeName}
            logo={logo}
            size="footer"
            href="/"
          />
          {description.trim() ? (
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {description.trim()}
            </p>
          ) : null}
          {location ? (
            <p className="text-sm text-muted-foreground">{location}</p>
          ) : null}
          {shippingEnabled ? (
            <p className="text-sm text-muted-foreground">
              {labels.shippingAvailable}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {labels.shop}
          </p>
          <ul className="space-y-2.5">
            {shopLinks.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-foreground/80 transition-colors hover:text-brand-accent"
                  style={{ transitionDuration: transition.fast }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {labels.contact}
          </p>
          <div className="flex flex-col gap-2.5 text-sm text-foreground/80">
            {email.trim() ? (
              <a
                href={`mailto:${email.trim()}`}
                className="transition-colors hover:text-brand-accent"
                style={{ transitionDuration: transition.fast }}
              >
                {email.trim()}
              </a>
            ) : null}
            {phone.trim() ? (
              <a
                href={`tel:${phone.trim()}`}
                className="transition-colors hover:text-brand-accent"
                style={{ transitionDuration: transition.fast }}
              >
                {phone.trim()}
              </a>
            ) : null}
            {whatsapp.trim() ? (
              <a
                href={whatsappHref(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-brand-accent"
                style={{ transitionDuration: transition.fast }}
              >
                {labels.whatsapp}
              </a>
            ) : null}
            {!email.trim() && !phone.trim() && !whatsapp.trim() ? (
              <p className="text-muted-foreground">{labels.contactComingSoon}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {labels.follow}
          </p>
          {socials.length > 0 ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground/80 transition-colors hover:text-brand-accent"
                    style={{ transitionDuration: transition.fast }}
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {labels.socialComingSoon}
            </p>
          )}
        </div>
      </div>

      <div className="storefront-container relative border-t border-border/60 py-7">
        <p className="text-sm text-muted-foreground">{labels.copyright}</p>
      </div>
    </footer>
  );
}
