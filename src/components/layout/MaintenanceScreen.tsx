/**
 * Full-storefront maintenance surface when `maintenanceMode` is on.
 *
 * Presentational: copy comes from StoreSettings (storeName / tagline / logo)
 * plus i18n fallback when tagline is empty.
 */

import { BrandLockup } from "@/features/storefront/components/BrandLockup";

type MaintenanceScreenProps = {
  storeName: string;
  tagline: string;
  logo?: string;
  /** i18n fallback when tagline is empty. */
  fallbackMessage: string;
};

export function MaintenanceScreen({
  storeName,
  tagline,
  logo = "",
  fallbackMessage,
}: MaintenanceScreenProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(
              ellipse 60% 45% at 50% 30%,
              color-mix(in oklab, var(--brand-accent) 14%, transparent),
              transparent 60%
            ),
            radial-gradient(
              ellipse 50% 40% at 80% 80%,
              color-mix(in oklab, var(--primary) 10%, transparent),
              transparent 55%
            )
          `,
        }}
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-6">
        <BrandLockup storeName={storeName} logo={logo} size="story" showName={false} />
        <h1 className="storefront-heading text-[clamp(2rem,5vw,3rem)] text-foreground">
          {storeName}
        </h1>
        <p className="max-w-md text-base text-muted-foreground sm:text-lg">
          {tagline.trim() || fallbackMessage}
        </p>
      </div>
    </div>
  );
}
