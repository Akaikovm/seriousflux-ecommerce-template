import { LoadingState } from "@/shared/ui/LoadingState";
import { cn } from "@/lib/utils";

type AdminLoadingStateProps = {
  className?: string;
  rows?: number;
};

/**
 * Admin page loading recipe (ADR-021).
 */
export function AdminLoadingState({
  className,
  rows = 4,
}: AdminLoadingStateProps) {
  return (
    <div className={cn("admin-page", className)}>
      <div className="admin-page-header">
        <div className="admin-page-header__copy gap-2">
          <LoadingState width="10rem" height="1.75rem" />
          <LoadingState width="16rem" height="1rem" />
        </div>
        <LoadingState width="8rem" height="2.5rem" />
      </div>
      <div className="admin-loading-state">
        {Array.from({ length: rows }, (_, index) => (
          <LoadingState key={index} width="100%" height="2.5rem" />
        ))}
      </div>
    </div>
  );
}
