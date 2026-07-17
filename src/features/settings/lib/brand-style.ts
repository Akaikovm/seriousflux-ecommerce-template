import type { CSSProperties } from "react";

import type { StoreSettings } from "@/features/settings/types";

/**
 * Maps StoreSettings brand colors onto CSS custom properties.
 *
 * Applied on `<html>` so Tailwind semantic tokens (`bg-primary`, etc.)
 * and `--brand-accent` pick up per-client branding without rebuilds.
 */

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.trim().replace(/^#/, "");
  const normalized =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

/**
 * Relative luminance (sRGB) for WCAG-ish contrast decisions.
 * Returns a light or dark foreground so primary CTAs stay readable.
 */
export function getContrastingForeground(backgroundHex: string): string {
  const rgb = parseHex(backgroundHex);
  if (!rgb) {
    return "#ffffff";
  }

  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.03928
      ? srgb / 12.92
      : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  const luminance =
    0.2126 * channel(rgb.r) +
    0.7152 * channel(rgb.g) +
    0.0722 * channel(rgb.b);

  return luminance > 0.45 ? "#0a0a0a" : "#ffffff";
}

export function getBrandStyle(settings: StoreSettings): CSSProperties {
  const primary = settings.primaryColor.trim() || "#0A0A0A";
  const accent = settings.secondaryColor.trim() || "#E10600";

  return {
    "--primary": primary,
    "--primary-foreground": getContrastingForeground(primary),
    "--brand-accent": accent,
    "--ring": primary,
  } as CSSProperties;
}
