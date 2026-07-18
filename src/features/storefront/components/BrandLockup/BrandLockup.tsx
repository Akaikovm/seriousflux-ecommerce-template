import Link from "next/link";

import { cn } from "@/lib/utils";
import { radius } from "@/shared/design/tokens";

type BrandLockupSize = "nav" | "footer" | "story";

type BrandLockupProps = {
  storeName: string;
  logo: string;
  /** Visual scale of the lockup. */
  size?: BrandLockupSize;
  /** When false, only the mark/logo renders (name stays in aria-label). */
  showName?: boolean;
  /** Wrap in a home link. */
  href?: string;
  className?: string;
  onNavigate?: () => void;
};

const SIZE = {
  nav: {
    logo: "h-10 max-h-10 w-auto max-w-[9.5rem] sm:h-11 sm:max-h-11 sm:max-w-[12rem]",
    mark: "h-10 w-10 text-base sm:h-11 sm:w-11 sm:text-lg",
    name: "text-lg sm:text-xl",
    gap: "gap-3",
  },
  footer: {
    logo: "h-11 max-h-11 w-auto max-w-[11rem]",
    mark: "h-11 w-11 text-lg",
    name: "text-2xl",
    gap: "gap-3.5",
  },
  story: {
    logo: "h-16 max-h-16 w-auto max-w-[14rem] sm:h-20 sm:max-h-20 sm:max-w-[16rem]",
    mark: "h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl",
    name: "text-3xl sm:text-4xl",
    gap: "gap-4",
  },
} as const;

/**
 * Shared brand lockup — logo (or monogram) + optional wordmark.
 *
 * Presentational only. Logo URLs come from StoreSettings.
 * Wide wordmark logos are supported via max-width + object-contain (not forced square).
 */
export function BrandLockup({
  storeName,
  logo,
  size = "nav",
  showName = true,
  href,
  className,
  onNavigate,
}: BrandLockupProps) {
  const tokens = SIZE[size];
  const hasLogo = logo.trim().length > 0;
  const initial = storeName.charAt(0).toUpperCase() || "S";

  const inner = (
    <>
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote logo hosts vary per client
        <img
          src={logo.trim()}
          alt=""
          className={cn("shrink-0 object-contain object-left", tokens.logo)}
        />
      ) : (
        <div
          className={cn(
            "storefront-heading flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
            tokens.mark,
          )}
          style={{ borderRadius: radius.md }}
          aria-hidden
        >
          {initial}
        </div>
      )}
      {showName ? (
        <span
          className={cn(
            "storefront-heading min-w-0 truncate tracking-tight text-foreground",
            tokens.name,
          )}
        >
          {storeName}
        </span>
      ) : null}
    </>
  );

  const surface = cn(
    "inline-flex min-w-0 items-center text-foreground",
    tokens.gap,
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          surface,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label={`${storeName} home`}
        onClick={onNavigate}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={surface} aria-label={storeName}>
      {inner}
    </div>
  );
}
