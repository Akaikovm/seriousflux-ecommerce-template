import { Heart, Package, Shield, Sparkles, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Section } from "@/features/storefront/components/Section";
import type { BrandValueItem } from "@/features/storefront/types/storefront";
import { cn } from "@/lib/utils";
import { typography } from "@/shared/design/tokens";

const ICONS: Record<BrandValueItem["icon"], LucideIcon> = {
  truck: Truck,
  shield: Shield,
  sparkles: Sparkles,
  heart: Heart,
  package: Package,
};

type BrandValuesProps = {
  title?: string;
  subtitle?: string;
  items: BrandValueItem[];
  className?: string;
};

/**
 * Brand value / trust section — configurable props, no hardcoded store name.
 */
export function BrandValues({
  title = "Why shop with us",
  subtitle,
  items,
  className,
}: BrandValuesProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Section
      className={cn("border-y border-border/60", className)}
      aria-labelledby="brand-values-title"
    >
      <div className="storefront-container">
        <div className="mb-12 max-w-2xl space-y-3">
          <h2
            id="brand-values-title"
            className="storefront-heading text-[clamp(1.75rem,4vw,2.5rem)] text-foreground"
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className="text-base text-muted-foreground sm:text-lg"
              style={{ lineHeight: typography.lineHeight.relaxed }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <li
                key={item.title}
                className="flex flex-col gap-4 border-t border-border/80 pt-6"
              >
                <span
                  className="inline-flex size-10 items-center justify-center text-brand-accent"
                  aria-hidden
                >
                  <Icon className="size-6" strokeWidth={1.25} />
                </span>
                <h3 className="storefront-heading text-xl text-foreground">
                  {item.title}
                </h3>
                <p
                  className="text-muted-foreground"
                  style={{
                    fontSize: typography.fontSize.sm,
                    lineHeight: typography.lineHeight.relaxed,
                    maxWidth: "28rem",
                  }}
                >
                  {item.description}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}

/**
 * Default value props derived from store capability flags — not brand identity.
 */
export function buildDefaultBrandValues(shippingEnabled: boolean): BrandValueItem[] {
  const items: BrandValueItem[] = [
    {
      icon: "sparkles",
      title: "Curated quality",
      description:
        "Every product is selected to meet a consistent standard of craft and finish.",
    },
    {
      icon: "shield",
      title: "Secure shopping",
      description:
        "Your order details stay protected with modern checkout practices.",
    },
  ];

  if (shippingEnabled) {
    items.unshift({
      icon: "truck",
      title: "Reliable delivery",
      description:
        "Clear shipping options so you know when your order will arrive.",
    });
  } else {
    items.unshift({
      icon: "package",
      title: "Careful fulfillment",
      description:
        "Orders are prepared with attention so products arrive ready to enjoy.",
    });
  }

  return items.slice(0, 3);
}
