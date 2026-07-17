import { AdminStatCard } from "@/features/admin/dashboard/AdminStatCard";
import { Badge } from "@/shared/ui/Badge";
import { Card } from "@/shared/ui/Card";

type DashboardOverviewProps = {
  productCount: number;
  categoryCount: number;
  storeName: string;
  maintenanceMode: boolean;
};

/**
 * Initial admin dashboard overview (RFC-011).
 */
export function DashboardOverview({
  productCount,
  categoryCount,
  storeName,
  maintenanceMode,
}: DashboardOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Snapshot of catalog and store status for {storeName || "your store"}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label="Products"
          value={productCount}
          hint="Active and inactive"
        />
        <AdminStatCard
          label="Categories"
          value={categoryCount}
          hint="Active and inactive"
        />
        <Card padding="md">
          <p className="text-sm text-muted-foreground">Store status</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant={maintenanceMode ? "secondary" : "primary"}>
              {maintenanceMode ? "Maintenance" : "Live"}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {maintenanceMode
              ? "Storefront is showing the maintenance screen."
              : "Storefront is publicly available."}
          </p>
        </Card>
      </div>
    </div>
  );
}
