import Link from "next/link";

import { cn } from "@/lib/utils";
import { radius, transition } from "@/shared/design/tokens";

/**
 * Presentational category tile.
 *
 * Optional `href` enables navigation to category landing pages.
 * No Firebase.
 */

export type CategoryCardProps = {
  title: string;
  image: string;
  slug: string;
  /** When set, the card becomes a link. */
  href?: string;
  className?: string;
};

export function CategoryCard({
  title,
  image,
  slug,
  href,
  className,
}: CategoryCardProps) {
  const hasImage = image.trim().length > 0;

  const content = (
    <>
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client; next/image domains are not fixed yet
        <img
          src={image}
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
          style={{ transitionDuration: transition.slower }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(
                145deg,
                color-mix(in oklab, var(--muted) 90%, var(--primary)) 0%,
                color-mix(in oklab, var(--primary) 25%, var(--muted)) 100%
              )
            `,
          }}
          aria-hidden
        />
      )}

      <div
        className="absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-transparent transition-opacity group-hover:from-black/80"
        style={{ transitionDuration: transition.normal }}
        aria-hidden
      />

      <div className="relative mt-auto flex w-full items-end p-5 sm:p-6">
        <h3 className="storefront-heading text-xl tracking-tight text-white sm:text-2xl">
          {title}
        </h3>
      </div>
    </>
  );

  const surfaceClass = cn(
    "group relative flex aspect-3/4 overflow-hidden sm:aspect-4/5",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        data-slug={slug}
        className={surfaceClass}
        style={{ borderRadius: radius.xl }}
        aria-label={title}
      >
        {content}
      </Link>
    );
  }

  return (
    <article
      data-slug={slug}
      className={surfaceClass}
      style={{ borderRadius: radius.xl }}
      aria-label={title}
    >
      {content}
    </article>
  );
}
