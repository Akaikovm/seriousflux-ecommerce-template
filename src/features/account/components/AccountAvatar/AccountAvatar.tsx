import { User } from "lucide-react";

import { cn } from "@/lib/utils";

type AccountAvatarProps = {
  photoURL?: string | null;
  displayName?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASS = {
  sm: "size-9",
  md: "size-14",
  lg: "size-20",
} as const;

/**
 * Customer avatar from `photoURL` (Google / profile URL).
 * Falls back to initials or a User icon — never Firebase in the UI.
 */
export function AccountAvatar({
  photoURL,
  displayName,
  size = "md",
  className,
}: AccountAvatarProps) {
  const trimmed = photoURL?.trim() ?? "";
  const initial = displayName?.trim().charAt(0).toUpperCase() || null;

  if (trimmed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary (Google, Storage, arbitrary URLs)
      <img
        src={trimmed}
        alt=""
        referrerPolicy="no-referrer"
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-border",
          SIZE_CLASS[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border",
        SIZE_CLASS[size],
        className,
      )}
    >
      {initial ? (
        <span className="text-sm font-semibold text-foreground">{initial}</span>
      ) : (
        <User className="size-1/2" />
      )}
    </span>
  );
}
