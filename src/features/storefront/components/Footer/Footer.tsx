import Link from "next/link";

import type { StorefrontNavLink } from "@/features/storefront/types/storefront";
import { transition } from "@/shared/design/tokens";

type FooterProps = {
  storeName: string;
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
  shopLinks?: StorefrontNavLink[];
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

const DEFAULT_SHOP_LINKS: StorefrontNavLink[] = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/#categories" },
  { label: "Featured", href: "/#featured" },
];

/**
 * Multi-column storefront footer — identity, shop links, contact, socials.
 * Presentational: settings fields passed from AppLayout.
 */
export function Footer({
  storeName,
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
  shopLinks = DEFAULT_SHOP_LINKS,
}: FooterProps) {
  const year = new Date().getFullYear();
  const socials = collectSocialLinks({ instagram, facebook, tiktok, youtube });
  const location = [address.trim(), country.trim()]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="w-full border-t border-border bg-muted/20">
      <div className="storefront-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <p className="text-base font-semibold tracking-tight text-foreground">
            {storeName}
          </p>
          {description.trim() ? (
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {description.trim()}
            </p>
          ) : null}
          {location ? (
            <p className="text-sm text-muted-foreground">{location}</p>
          ) : null}
          {shippingEnabled ? (
            <p className="text-sm text-muted-foreground">Shipping available</p>
          ) : null}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Shop</p>
          <ul className="space-y-2">
            {shopLinks.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-brand-accent"
                  style={{ transitionDuration: transition.fast }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Contact</p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
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
                WhatsApp
              </a>
            ) : null}
            {!email.trim() && !phone.trim() && !whatsapp.trim() ? (
              <p>Contact details coming soon</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Follow</p>
          {socials.length > 0 ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-brand-accent"
                    style={{ transitionDuration: transition.fast }}
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Social links coming soon
            </p>
          )}
        </div>
      </div>

      <div className="storefront-container border-t border-border py-6">
        <p className="text-sm text-muted-foreground">
          © {year} {storeName}
        </p>
      </div>
    </footer>
  );
}
