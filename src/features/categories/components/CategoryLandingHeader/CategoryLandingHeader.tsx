"use client";

import { StorefrontBreadcrumb } from "@/features/storefront/components/StorefrontBreadcrumb";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";
import { radius } from "@/shared/design/tokens";

type CategoryLandingHeaderProps = {
  name: string;
  description: string;
  image: string;
  productCount: number;
  className?: string;
};

/**
 * Category landing header — split layout (media + copy).
 * Text stays outside the image. Works for logos and photos without a sparse full-bleed banner.
 */
export function CategoryLandingHeader({
  name,
  description,
  image,
  productCount,
  className,
}: CategoryLandingHeaderProps) {
  const t = useT();
  const hasImage = image.trim().length > 0;
  const countLabel =
    productCount === 1
      ? t("categories.productOne")
      : t("categories.productMany", { count: productCount });
  const subtitle =
    description.trim() || t("categories.browseIn", { name });

  return (
    <div className={cn("mb-10 sm:mb-12", className)}>
      <StorefrontBreadcrumb
        items={[
          { label: t("nav.home"), href: "/" },
          { label: t("nav.collections"), href: "/#categories" },
          { label: name },
        ]}
      />

      <div
        className={cn(
          "grid items-center gap-8 lg:gap-12",
          hasImage && "lg:grid-cols-12",
        )}
      >
        {hasImage ? (
          <div
            className="relative aspect-[4/3] overflow-hidden lg:col-span-5"
            style={{
              borderRadius: radius["2xl"],
              backgroundImage: `
                linear-gradient(
                  145deg,
                  color-mix(in oklab, var(--muted) 88%, var(--primary)) 0%,
                  color-mix(in oklab, var(--primary) 10%, var(--muted)) 100%
                )
              `,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client */}
            <img
              src={image}
              alt=""
              className="absolute inset-0 size-full object-contain p-6 sm:p-8"
            />
          </div>
        ) : null}

        <div
          className={cn(
            "flex min-w-0 flex-col gap-3",
            hasImage ? "lg:col-span-7" : "max-w-3xl",
          )}
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {t("categories.collection")}
          </p>
          <h1
            id="category-title"
            className="storefront-heading text-[clamp(1.75rem,4vw,2.75rem)] text-balance text-foreground"
          >
            {name}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
          <p className="pt-1 text-sm text-muted-foreground">{countLabel}</p>
        </div>
      </div>
    </div>
  );
}
