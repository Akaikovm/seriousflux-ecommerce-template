import type { ReactNode } from "react";

import type { StoreSettings } from "@/features/settings/types";
import { Footer } from "@/features/storefront/components/Footer";
import { Navbar } from "@/features/storefront/components/Navbar";
import type { StorefrontNavLink } from "@/features/storefront/types/storefront";
import { MaintenanceScreen } from "@/components/layout/MaintenanceScreen";
import { createT, getDictionary } from "@/i18n";
import { getRequestLanguage } from "@/i18n/get-request-language";

/**
 * Shell for every storefront page: Navbar → main → Footer.
 *
 * Receives StoreSettings from the storefront layout (the only data-loading
 * boundary for configuration). Child layout pieces stay presentational.
 */

type AppLayoutProps = {
  settings: StoreSettings;
  children: ReactNode;
};

export async function AppLayout({ settings, children }: AppLayoutProps) {
  const language = await getRequestLanguage(settings.language);
  const t = createT(getDictionary(language));
  const hasStory =
    settings.description.trim().length > 0 || settings.tagline.trim().length > 0;

  const navLinks: StorefrontNavLink[] = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.collections"), href: "/#categories" },
    { label: t("nav.shop"), href: "/#featured" },
    ...(hasStory ? [{ label: t("nav.about"), href: "/#about" }] : []),
  ];

  return (
    <div className="storefront-shell flex min-h-full flex-1 flex-col">
      <Navbar
        storeName={settings.storeName}
        logo={settings.logo}
        navLinks={navLinks}
        allowLanguageSwitch={settings.allowLanguageSwitch}
      />
      <main className="flex w-full flex-1 flex-col">
        {settings.maintenanceMode ? (
          <MaintenanceScreen
            storeName={settings.storeName}
            tagline={settings.tagline}
            logo={settings.logo}
            fallbackMessage={t("maintenance.fallbackMessage")}
          />
        ) : (
          children
        )}
      </main>
      <Footer
        storeName={settings.storeName}
        logo={settings.logo}
        description={settings.description || settings.tagline}
        email={settings.email}
        phone={settings.phone}
        whatsapp={settings.whatsapp}
        address={settings.address}
        country={settings.country}
        instagram={settings.instagram}
        facebook={settings.facebook}
        tiktok={settings.tiktok}
        youtube={settings.youtube}
        shippingEnabled={settings.shippingEnabled}
        shopLinks={navLinks}
        labels={{
          shop: t("footer.shop"),
          contact: t("footer.contact"),
          follow: t("footer.follow"),
          shippingAvailable: t("footer.shippingAvailable"),
          contactComingSoon: t("footer.contactComingSoon"),
          socialComingSoon: t("footer.socialComingSoon"),
          whatsapp: t("footer.whatsapp"),
          copyright: t("footer.copyright", {
            year: new Date().getFullYear(),
            storeName: settings.storeName,
          }),
        }}
      />
    </div>
  );
}
