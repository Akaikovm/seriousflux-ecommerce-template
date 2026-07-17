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
      className={cn("border-y border-border bg-muted/20", className)}
      aria-labelledby="brand-values-title"
    >
      <div className="storefront-container">
        <div className="mb-10 max-w-2xl space-y-2">
          <h2
            id="brand-values-title"
            className="font-semibold tracking-tight text-foreground"
            style={{
              fontSize: typography.fontSize["2xl"],
              lineHeight: typography.lineHeight.tight,
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className="text-base text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={item.title} className="flex flex-col gap-3">
                <span
                  className="inline-flex size-10 items-center justify-center text-primary"
                  aria-hidden
                >
                  <Icon className="size-6" strokeWidth={1.5} />
                </span>
                <h3
                  className="font-medium text-foreground"
                  style={{
                    fontSize: typography.fontSize.lg,
                    lineHeight: typography.lineHeight.tight,
                  }}
                >
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
