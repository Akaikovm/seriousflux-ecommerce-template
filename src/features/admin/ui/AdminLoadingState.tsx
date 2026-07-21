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
  rows = 5,
}: AdminLoadingStateProps) {
  return (
    <div className={cn("admin-page admin-page--list", className)}>
      <div className="admin-page-header">
        <div className="admin-page-header__copy gap-2">
          <LoadingState width="10rem" height="1.5rem" />
          <LoadingState width="16rem" height="0.875rem" />
        </div>
        <LoadingState width="7rem" height="2.25rem" />
      </div>
      <div className="admin-list">
        <div className="admin-loading-state border-0 shadow-none">
          {Array.from({ length: rows }, (_, index) => (
            <LoadingState key={index} width="100%" height="3.25rem" />
          ))}
        </div>
      </div>
    </div>
  );
}
