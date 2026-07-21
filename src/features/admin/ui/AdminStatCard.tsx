import { AdminSurface } from "@/features/admin/ui/AdminSurface";
import { cn } from "@/lib/utils";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
};

/**
 * Dashboard metric card (ADR-021).
 */
export function AdminStatCard({
  label,
  value,
  hint,
  className,
}: AdminStatCardProps) {
  return (
    <AdminSurface compact className={cn(className)}>
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">{value}</p>
      {hint ? <p className="admin-stat-card__hint">{hint}</p> : null}
    </AdminSurface>
  );
}
