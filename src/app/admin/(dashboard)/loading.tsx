import { LoadingState } from "@/shared/ui/LoadingState";

/**
 * Instant feedback while admin RSC pages resolve Firestore reads.
 */
export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <LoadingState width="10rem" height="1.75rem" />
          <LoadingState width="16rem" height="1rem" />
        </div>
        <LoadingState width="8rem" height="2.5rem" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card p-3">
        <div className="flex flex-col gap-2">
          <LoadingState width="100%" height="2.5rem" />
          <LoadingState width="100%" height="2.5rem" />
          <LoadingState width="100%" height="2.5rem" />
          <LoadingState width="100%" height="2.5rem" />
        </div>
      </div>
    </div>
  );
}
