import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { getStoreSettings } from "@/features/settings/lib/get-store-settings";
import { buildStoreMetadata } from "@/features/settings/lib/store-metadata";

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
 * Provides html/body, fonts, and global CSS only.
 * Storefront chrome lives in `(storefront)/layout.tsx`.
 * Admin chrome lives in `admin/(dashboard)/layout.tsx`.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const settings = await getStoreSettings();

  return (
    <html
      lang={settings.language || "en"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
