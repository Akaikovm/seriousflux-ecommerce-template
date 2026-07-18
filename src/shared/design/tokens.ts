/**
 * Serious Flux design tokens — structural + semantic primitives.
 *
 * Brand colors come from StoreSettings at runtime (`--primary`,
 * `--brand-accent` on `<html>` via `getBrandStyle`). Color tokens below
 * reference CSS variables only — never hardcoded brand hex values.
 *
 * Components in `src/shared/ui` and `src/features/storefront` must reference
 * these tokens instead of hardcoding spacing, radius, shadow, motion, or type.
 */

/** Spacing scale (CSS lengths). */
export const spacing = {
  none: "0",
  xs: "0.25rem",
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
  "3xl": "3rem",
  "4xl": "4rem",
  "5xl": "6rem",
} as const;

export type SpacingToken = keyof typeof spacing;

/** Border radius scale (CSS lengths). */
export const radius = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  full: "9999px",
} as const;

export type RadiusToken = keyof typeof radius;

/** Max container widths for layout constraints. */
export const container = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "90rem",
  full: "100%",
} as const;

export type ContainerToken = keyof typeof container;

/** Responsive breakpoints (min-width). */
export const breakpoints = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const;

export type BreakpointToken = keyof typeof breakpoints;

/** Elevation / shadow levels. */
export const shadow = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
} as const;

export type ShadowToken = keyof typeof shadow;

/** Transition durations (CSS time). */
export const transition = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const;

export type TransitionToken = keyof typeof transition;

/** Motion aliases for storefront micro-interactions. */
export const motion = {
  hover: transition.slow,
  enter: transition.normal,
  exit: transition.fast,
} as const;

/** Stacking order scale. */
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;

export type ZIndexToken = keyof typeof zIndex;

/**
 * Semantic color token names — CSS variable references only.
 * Runtime brand values are injected via StoreSettings → getBrandStyle.
 */
export const colors = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  brandAccent: "var(--brand-accent)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  border: "var(--border)",
  ring: "var(--ring)",
  card: "var(--card)",
  cardForeground: "var(--card-foreground)",
  destructive: "var(--destructive)",
} as const;

export type ColorToken = keyof typeof colors;

/** Typography scale — size, weight, and line-height primitives. */
export const typography = {
  fontFamily: {
    sans: "var(--font-sans)",
    heading: "var(--font-heading)",
    mono: "var(--font-mono)",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
    "5xl": "3rem",
    "6xl": "3.75rem",
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    none: "1",
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.625",
  },
  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
  },
} as const;

export type FontSizeToken = keyof typeof typography.fontSize;
export type FontWeightToken = keyof typeof typography.fontWeight;
export type LineHeightToken = keyof typeof typography.lineHeight;

/** Aggregated token surface for ergonomic imports. */
export const tokens = {
  spacing,
  radius,
  container,
  breakpoints,
  shadow,
  transition,
  motion,
  zIndex,
  colors,
  typography,
} as const;

export type DesignTokens = typeof tokens;
