import type { ReactNode } from "react";

import { container, spacing, typography } from "@/shared/design/tokens";

/**
 * Design System EmptyState — reusable empty placeholder.
 *
 * Domain-agnostic. Feature wrappers (e.g. EmptyCart) compose this later.
 */

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Optional primary action slot (typically a Button). */
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex w-full flex-col items-center text-center"
      style={{ gap: spacing.lg, paddingBlock: spacing["3xl"], paddingInline: spacing.xl }}
    >
      <div className="flex flex-col" style={{ gap: spacing.sm }}>
        <h3
          className="text-foreground"
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          {title}
        </h3>

        {description ? (
          <p
            className="text-muted-foreground"
            style={{
              fontSize: typography.fontSize.sm,
              lineHeight: typography.lineHeight.normal,
              maxWidth: container.sm,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}
