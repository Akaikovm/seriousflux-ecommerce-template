import { Card } from "@/shared/ui/Card";

type AdminStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

/**
 * Simple dashboard metric card (RFC-011). No charts.
 */
export function AdminStatCard({ label, value, hint }: AdminStatCardProps) {
  return (
    <Card
      padding="md"
      className="transition-transform duration-200 hover:-translate-y-0.5"
      hover
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}
