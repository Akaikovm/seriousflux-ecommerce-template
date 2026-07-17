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
    <div className={cn("mb-8 space-y-2", className)}>
      <h2
        id={id}
        className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-2xl text-base text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
