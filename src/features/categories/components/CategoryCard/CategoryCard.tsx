import Link from "next/link";

import { cn } from "@/lib/utils";
import { radius, transition, typography } from "@/shared/design/tokens";

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
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ transitionDuration: transition.slower }}
        />
      ) : (
        <div className="absolute inset-0 bg-muted/60" aria-hidden />
      )}

      <div
        className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent transition-opacity group-hover:from-black/75"
        style={{ transitionDuration: transition.normal }}
        aria-hidden
      />

      <div className="relative mt-auto flex w-full items-end p-4 sm:p-5">
        <h3
          className="font-semibold tracking-tight text-white drop-shadow-sm"
          style={{
            fontSize: typography.fontSize.lg,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          {title}
        </h3>
      </div>
    </>
  );

  const surfaceClass = cn(
    "group relative flex aspect-[4/5] overflow-hidden border border-border bg-muted/40 sm:aspect-[4/3]",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        data-slug={slug}
        className={surfaceClass}
        style={{ borderRadius: radius.lg }}
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
      style={{ borderRadius: radius.lg }}
      aria-label={title}
    >
      {content}
    </article>
  );
}
