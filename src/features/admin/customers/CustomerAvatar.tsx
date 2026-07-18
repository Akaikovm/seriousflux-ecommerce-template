import { cn } from "@/lib/utils";

type CustomerAvatarProps = {
  name: string;
  photoURL?: string | null;
  size?: "sm" | "md";
  className?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
}

/**
 * Compact avatar for Admin customer tables and headers.
 */
export function CustomerAvatar({
  name,
  photoURL,
  size = "sm",
  className,
}: CustomerAvatarProps) {
  const dimension = size === "md" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";

  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote URL from profile, not a fixed domain
      <img
        src={photoURL}
        alt=""
        className={cn(
          "shrink-0 rounded-full object-cover bg-muted",
          dimension,
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground",
        dimension,
        className,
      )}
    >
      {initials(name || "?")}
    </span>
  );
}
