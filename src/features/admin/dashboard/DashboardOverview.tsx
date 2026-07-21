import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminSurface,
} from "@/features/admin/ui";
import { createT, getDictionary, resolveLanguage } from "@/i18n";
import { Badge } from "@/shared/ui/Badge";

type DashboardOverviewProps = {
  productCount: number;
  categoryCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  storeName: string;
  maintenanceMode: boolean;
  language?: string;
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
  language,
}: DashboardOverviewProps) {
  const t = createT(getDictionary(resolveLanguage(language)));
  const storeLabel = storeName || t("admin.dashboard.descriptionFallback");

  return (
    <AdminPage detail>
      <AdminPageHeader
        eyebrow={t("admin.dashboard.eyebrow")}
        title={t("admin.dashboard.title")}
        description={t("admin.dashboard.description", { storeName: storeLabel })}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label={t("admin.dashboard.products")}
          value={productCount}
          hint={t("admin.dashboard.activeInactiveHint")}
        />
        <AdminStatCard
          label={t("admin.dashboard.categories")}
          value={categoryCount}
          hint={t("admin.dashboard.activeInactiveHint")}
        />
        <AdminStatCard
          label={t("admin.dashboard.lowStock")}
          value={lowStockCount}
          hint={t("admin.dashboard.lowStockHint")}
        />
        <AdminStatCard
          label={t("admin.dashboard.outOfStock")}
          value={outOfStockCount}
          hint={t("admin.dashboard.outOfStockHint")}
        />
        <AdminSurface compact>
          <p className="admin-stat-card__label">{t("admin.dashboard.storeStatus")}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary">
              {maintenanceMode
                ? t("admin.dashboard.maintenance")
                : t("admin.dashboard.live")}
            </Badge>
          </div>
          <p className="admin-stat-card__hint">
            {maintenanceMode
              ? t("admin.dashboard.maintenanceHint")
              : t("admin.dashboard.liveHint")}
          </p>
        </AdminSurface>
      </div>
    </AdminPage>
  );
}
