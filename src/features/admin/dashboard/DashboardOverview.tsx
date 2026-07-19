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
  lowStockCount: number;
  outOfStockCount: number;
  storeName: string;
  maintenanceMode: boolean;
};

/**
 * Admin dashboard overview (ADR-021 / RFC-023).
 * Extends existing Overview — does not introduce a separate Inventory dashboard.
 */
export function DashboardOverview({
  productCount,
  categoryCount,
  lowStockCount,
  outOfStockCount,
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
        <AdminStatCard
          label="Low stock"
          value={lowStockCount}
          hint="Tracked products at or below threshold"
        />
        <AdminStatCard
          label="Out of stock"
          value={outOfStockCount}
          hint="Tracked products with zero quantity"
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
