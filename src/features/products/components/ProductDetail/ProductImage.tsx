import { cn } from "@/lib/utils";
import { radius } from "@/shared/design/tokens";

/**
 * Main product image for the detail page.
 *
 * v1 shows a single primary image. Structure leaves room for a future gallery.
 */

export type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const hasImage = src.trim().length > 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="relative aspect-square w-full overflow-hidden bg-muted/40 md:aspect-4/5"
        style={{
          borderRadius: radius["2xl"],
          backgroundImage: hasImage
            ? undefined
            : `
              linear-gradient(
                145deg,
                color-mix(in oklab, var(--muted) 90%, var(--primary)) 0%,
                color-mix(in oklab, var(--primary) 18%, var(--muted)) 100%
              )
            `,
        }}
        data-product-image
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client; next/image domains are not fixed yet
          <img src={src} alt={alt} className="size-full object-cover" />
        ) : (
          <div className="size-full" aria-hidden />
        )}
      </div>

      {/* Future: thumbnail gallery strip */}
      <div className="hidden gap-2" aria-hidden data-product-image-thumbs />
    </div>
  );
}
