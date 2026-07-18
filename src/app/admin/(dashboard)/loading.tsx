import { AdminLoadingState } from "@/features/admin/ui";

/**
 * Instant feedback while admin RSC pages resolve Firestore reads.
 */
export default function AdminDashboardLoading() {
  return <AdminLoadingState />;
}
