import { useMemo } from 'react';
import { StyleSheet, TextStyle } from 'react-native';

/*
 * HomeoRemedica mobile — "Pharmacopoeia" design language.
 * Mirrors apps/web/app/globals.css: apothecary-ledger print aesthetic.
 * Warm paper theme, bottle-green primary, rubric-red accents, hairline +
 * double print rules, near-square corners, Didot/Bodoni-style display serif
 * (Playfair Display) with mono "specimen labels" (Space Mono).
 *
 * The app is light (paper) only — there is no dark mode. Colors are kept as
 * hsl() strings copied verbatim from the web tokens so the two apps render the
 * same ink (React Native parses hsl()/hsla() natively).
 */

type Palette = {
  background: string;
  foreground: string;
  card: string;
  surface: string;
  surfaceBright: string;
  surfaceLowest: string;
  surfaceLow: string;
  surfaceHigh: string;
  onSurface: string;
  onSurfaceVariant: string;
  primary: string;
  primaryForeground: string;
  primaryContainer: string;
  secondary: string;
  secondaryForeground: string;
  tertiary: string;
  tertiaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  warning: string;
  border: string;
  ring: string;
  scrim: string;
};

const light: Palette = {
  background: 'hsl(42, 33%, 93%)',
  foreground: 'hsl(165, 28%, 12%)',
  card: 'hsl(45, 41%, 96%)',
  surface: 'hsl(42, 33%, 93%)',
  surfaceBright: 'hsl(45, 50%, 98%)',
  surfaceLowest: 'hsl(45, 41%, 96%)',
  surfaceLow: 'hsl(43, 30%, 89%)',
  surfaceHigh: 'hsl(42, 26%, 85%)',
  onSurface: 'hsl(165, 28%, 12%)',
  onSurfaceVariant: 'hsl(162, 12%, 34%)',
  primary: 'hsl(161, 58%, 19%)',
  primaryForeground: 'hsl(45, 55%, 96%)',
  primaryContainer: 'hsl(159, 36%, 30%)',
  secondary: 'hsl(40, 30%, 84%)',
  secondaryForeground: 'hsl(35, 38%, 24%)',
  tertiary: 'hsl(11, 64%, 38%)',
  tertiaryForeground: 'hsl(45, 55%, 96%)',
  muted: 'hsl(43, 26%, 88%)',
  mutedForeground: 'hsl(162, 10%, 38%)',
  accent: 'hsl(152, 24%, 84%)',
  accentForeground: 'hsl(161, 58%, 17%)',
  destructive: 'hsl(4, 64%, 40%)',
  destructiveForeground: 'hsl(45, 55%, 96%)',
  success: 'hsl(146, 48%, 28%)',
  warning: 'hsl(36, 84%, 44%)',
  border: 'hsl(160, 12%, 38%)',
  ring: 'hsl(161, 58%, 22%)',
  scrim: 'hsl(165, 30%, 8%)',
};

/** Inject an alpha channel into an hsl() string -> hsla(). */
export function withAlpha(color: string, alpha: number): string {
  const open = color.indexOf('(');
  const close = color.lastIndexOf(')');
  if (open === -1 || close === -1) return color;
  return `hsla(${color.slice(open + 1, close)}, ${alpha})`;
}

/* Print corners stay close to square (web --radius = 3px). */
export const radius = {
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  page: 20,
} as const;

export const fonts = {
  displayRegular: 'PlayfairDisplay-Regular',
  display: 'PlayfairDisplay-Medium',
  displaySemibold: 'PlayfairDisplay-SemiBold',
  displayBold: 'PlayfairDisplay-Bold',
  mono: 'SpaceMono',
} as const;

/*
 * Type scale. Display contexts use the serif; "specimen label" eyebrows and
 * metadata use the mono. Body text uses the platform sans (matches the web,
 * whose Seravek/Gill stack degrades to the system sans for most readers).
 * Color is applied by the consumer from the active palette.
 */
export const type = {
  displayLg: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, letterSpacing: -0.4 },
  displayMd: { fontFamily: fonts.display, fontSize: 27, lineHeight: 31, letterSpacing: -0.3 },
  displaySm: { fontFamily: fonts.display, fontSize: 21, lineHeight: 26, letterSpacing: -0.2 },
  title: { fontFamily: fonts.display, fontSize: 18, lineHeight: 23, letterSpacing: -0.1 },
  // Mono "specimen label". NOTE: no textTransform; labels stay in their
  // authored case for accessibility and platform-native text behavior.
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1,
    lineHeight: 15,
  },
  mono: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 0.2, lineHeight: 16 },
  monoSm: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.6, lineHeight: 14 },
  bodyLg: { fontSize: 16, lineHeight: 24 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySm: { fontSize: 13, lineHeight: 19 },
} satisfies Record<string, TextStyle>;

export type Theme = {
  colors: Palette;
};

const theme: Theme = { colors: light };

export function useTheme(): Theme {
  return theme;
}

/** Memoized StyleSheet bound to the theme. */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  return useMemo(() => StyleSheet.create(factory(theme)), [factory]);
}
