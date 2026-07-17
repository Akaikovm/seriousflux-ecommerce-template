import { cn } from "@/lib/utils";
import { radius, shadow } from "@/shared/design/tokens";

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
        className="relative aspect-square w-full overflow-hidden border border-border bg-muted/40 md:aspect-[4/5]"
        style={{ borderRadius: radius.xl, boxShadow: shadow.sm }}
        data-product-image
      >
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client; next/image domains are not fixed yet
          <img src={src} alt={alt} className="size-full object-cover" />
        ) : (
          <div className="size-full bg-muted/60" aria-hidden />
        )}
      </div>

      {/* Future: thumbnail gallery strip */}
      <div
        className="hidden gap-2"
        aria-hidden
        data-product-image-thumbs
      />
    </div>
  );
}
