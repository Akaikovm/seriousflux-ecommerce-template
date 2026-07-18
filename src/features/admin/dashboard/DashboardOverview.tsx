import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminSurface,
} from "@/features/admin/ui";
import { Badge } from "@/shared/ui/Badge";

type DashboardOverviewProps = {
  productCount: number;
  categoryCount: number;
  storeName: string;
  maintenanceMode: boolean;
};

/**
 * Admin dashboard overview (ADR-021).
 */
export function DashboardOverview({
  productCount,
  categoryCount,
  storeName,
  maintenanceMode,
}: DashboardOverviewProps) {
  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Dashboard"
        title="Overview"
        description={`Snapshot of catalog and store status for ${storeName || "your store"}.`}
      />

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
        <AdminSurface compact>
          <p className="admin-stat-card__label">Store status</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant={maintenanceMode ? "secondary" : "primary"}>
              {maintenanceMode ? "Maintenance" : "Live"}
            </Badge>
          </div>
          <p className="admin-stat-card__hint mt-2">
            {maintenanceMode
              ? "Storefront is showing the maintenance screen."
              : "Storefront is publicly available."}
          </p>
        </AdminSurface>
      </div>
    </AdminPage>
  );
}
