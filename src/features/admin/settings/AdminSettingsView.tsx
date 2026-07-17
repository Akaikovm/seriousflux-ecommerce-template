import type { ReactNode } from "react";

import type { StoreSettings } from "@/features/settings/types";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

type AdminSettingsViewProps = {
  settings: StoreSettings;
};

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-border py-3 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

/**
 * Store settings read view with edit foundation (RFC-011).
 * Advanced visual editor is deferred.
 */
export function AdminSettingsView({ settings }: AdminSettingsViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Brand identity and hero configuration for this store deployment.
          </p>
        </div>
        <Button type="button" disabled title="Coming in a future RFC">
          Edit settings
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card padding="md">
          <h3 className="text-sm font-semibold text-foreground">Identity</h3>
          <dl className="mt-2">
            <SettingRow label="Store name">{settings.storeName || "—"}</SettingRow>
            <SettingRow label="Logo">
              {settings.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client; next/image domains are not fixed yet
                <img
                  src={settings.logo}
                  alt=""
                  className="h-10 w-auto max-w-[7rem] rounded-md bg-muted object-contain"
                />
              ) : (
                "—"
              )}
            </SettingRow>
            <SettingRow label="Primary color">
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-4 rounded-full border border-border"
                  style={{ background: settings.primaryColor }}
                  aria-hidden
                />
                {settings.primaryColor || "—"}
              </span>
            </SettingRow>
            <SettingRow label="Secondary color">
              <span className="inline-flex items-center gap-2">
                <span
                  className="size-4 rounded-full border border-border"
                  style={{ background: settings.secondaryColor }}
                  aria-hidden
                />
                {settings.secondaryColor || "—"}
              </span>
            </SettingRow>
            <SettingRow label="Status">
              <Badge variant={settings.maintenanceMode ? "secondary" : "primary"}>
                {settings.maintenanceMode ? "Maintenance" : "Live"}
              </Badge>
            </SettingRow>
          </dl>
        </Card>

        <Card padding="md">
          <h3 className="text-sm font-semibold text-foreground">Hero</h3>
          <dl className="mt-2">
            <SettingRow label="Title">
              {settings.hero?.title || "—"}
            </SettingRow>
            <SettingRow label="Subtitle">
              {settings.hero?.subtitle || "—"}
            </SettingRow>
            <SettingRow label="CTA">
              {settings.hero?.ctaText
                ? `${settings.hero.ctaText} → ${settings.hero.ctaHref || "/"}`
                : "—"}
            </SettingRow>
            <SettingRow label="Image">
              {settings.hero?.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote hosts vary per client; next/image domains are not fixed yet
                <img
                  src={settings.hero.image}
                  alt=""
                  className="h-24 w-full max-w-sm rounded-md bg-muted object-cover"
                />
              ) : (
                "—"
              )}
            </SettingRow>
          </dl>
        </Card>
      </div>
    </div>
  );
}
