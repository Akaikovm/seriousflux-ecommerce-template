import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/app/providers";
import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { buildStoreMetadata } from "@/features/settings/lib/store-metadata";
import { getDictionary, resolveLanguage } from "@/i18n";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Default storefront heading face — clean and versatile across client verticals.
 * Per-client font families can move to StoreSettings later.
 */
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/**
 * Root metadata from StoreSettings (title, description, favicon).
 * Deduped with layout body via `getStoreSettings` + React `cache()`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  return buildStoreMetadata(settings);
}

/**
 * Application root layout.
 *
 * Provides html/body, fonts, global CSS, and a single AuthProvider (RFC-017).
 * Storefront chrome lives in `(storefront)/layout.tsx`.
 * Admin chrome lives in `admin/(dashboard)/layout.tsx`.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const settings = await getStoreSettings();
  const language = resolveLanguage(settings.language);
  const dictionary = getDictionary(language);

  return (
    <html
      lang={language}
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <AppProviders language={language} dictionary={dictionary}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
