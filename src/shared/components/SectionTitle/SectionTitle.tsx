import { cn } from "@/lib/utils";

/**
 * Standard section heading block: title + optional subtitle.
 *
 * Keeps typography consistent across Featured Categories, Products, etc.
 */

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  className?: string;
  /** Optional id for aria-labelledby on the parent Section. */
  id?: string;
};

export function SectionTitle({
  title,
  subtitle,
  className,
  id,
}: SectionTitleProps) {
  return (
    <div className={cn("mb-10 space-y-3 sm:mb-12", className)}>
      <h2
        id={id}
        className="storefront-heading text-[clamp(1.75rem,4vw,2.75rem)] text-foreground"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
