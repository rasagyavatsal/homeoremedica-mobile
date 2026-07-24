import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform, StyleSheet, TextStyle, useColorScheme, ViewStyle } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export type Palette = {
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
  primaryFixed: string;
  primaryFixedDim: string;
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
  successForeground: string;
  warning: string;
  warningForeground: string;
  border: string;
  input: string;
  ring: string;
  outlineVariant: string;
  scrim: string;
};

const light: Palette = {
  background: 'hsl(42, 28%, 97%)',
  foreground: 'hsl(153, 14%, 12%)',
  card: 'hsl(40, 25%, 99%)',
  surface: 'hsl(42, 28%, 97%)',
  surfaceBright: 'hsl(40, 33%, 99%)',
  surfaceLowest: 'hsl(40, 25%, 99%)',
  surfaceLow: 'hsl(42, 20%, 94%)',
  surfaceHigh: 'hsl(42, 14%, 89%)',
  onSurface: 'hsl(153, 14%, 12%)',
  onSurfaceVariant: 'hsl(150, 7%, 38%)',
  primary: 'hsl(146, 24%, 28%)',
  primaryForeground: 'hsl(42, 35%, 98%)',
  primaryContainer: 'hsl(146, 24%, 23%)',
  primaryFixed: 'hsl(140, 24%, 91%)',
  primaryFixedDim: 'hsl(141, 20%, 84%)',
  secondary: 'hsl(42, 15%, 91%)',
  secondaryForeground: 'hsl(153, 12%, 20%)',
  tertiary: 'hsl(142, 22%, 38%)',
  tertiaryForeground: 'hsl(42, 35%, 98%)',
  muted: 'hsl(42, 15%, 92%)',
  mutedForeground: 'hsl(150, 6%, 43%)',
  accent: 'hsl(141, 23%, 89%)',
  accentForeground: 'hsl(146, 26%, 23%)',
  destructive: 'hsl(4, 47%, 43%)',
  destructiveForeground: 'hsl(42, 35%, 98%)',
  success: 'hsl(142, 28%, 34%)',
  successForeground: 'hsl(142, 32%, 22%)',
  warning: 'hsl(35, 59%, 45%)',
  warningForeground: 'hsl(32, 52%, 23%)',
  border: 'hsl(150, 8%, 51%)',
  input: 'hsl(150, 8%, 43%)',
  ring: 'hsl(146, 24%, 28%)',
  outlineVariant: 'hsl(150, 7%, 70%)',
  scrim: 'hsl(150, 18%, 5%)',
};

const dark: Palette = {
  background: 'hsl(0, 0%, 0%)',
  foreground: 'hsl(45, 14%, 90%)',
  card: 'hsl(0, 0%, 4%)',
  surface: 'hsl(0, 0%, 0%)',
  surfaceBright: 'hsl(0, 0%, 7%)',
  surfaceLowest: 'hsl(0, 0%, 4%)',
  surfaceLow: 'hsl(0, 0%, 7%)',
  surfaceHigh: 'hsl(0, 0%, 11%)',
  onSurface: 'hsl(45, 14%, 90%)',
  onSurfaceVariant: 'hsl(45, 7%, 64%)',
  primary: 'hsl(140, 22%, 68%)',
  primaryForeground: 'hsl(0, 0%, 3%)',
  primaryContainer: 'hsl(140, 18%, 57%)',
  primaryFixed: 'hsl(142, 16%, 20%)',
  primaryFixedDim: 'hsl(142, 14%, 15%)',
  secondary: 'hsl(0, 0%, 11%)',
  secondaryForeground: 'hsl(45, 10%, 82%)',
  tertiary: 'hsl(140, 20%, 66%)',
  tertiaryForeground: 'hsl(0, 0%, 3%)',
  muted: 'hsl(0, 0%, 10%)',
  mutedForeground: 'hsl(45, 6%, 61%)',
  accent: 'hsl(140, 12%, 15%)',
  accentForeground: 'hsl(140, 24%, 72%)',
  destructive: 'hsl(4, 53%, 62%)',
  destructiveForeground: 'hsl(0, 0%, 3%)',
  success: 'hsl(140, 25%, 63%)',
  successForeground: 'hsl(140, 27%, 82%)',
  warning: 'hsl(38, 58%, 62%)',
  warningForeground: 'hsl(42, 72%, 86%)',
  border: 'hsl(0, 0%, 45%)',
  input: 'hsl(0, 0%, 50%)',
  ring: 'hsl(140, 22%, 68%)',
  outlineVariant: 'hsl(0, 0%, 27%)',
  scrim: 'hsl(0, 0%, 0%)',
};

export function withAlpha(color: string, alpha: number): string {
  const open = color.indexOf('(');
  const close = color.lastIndexOf(')');
  if (open === -1 || close === -1) return color;
  return `hsla(${color.slice(open + 1, close)}, ${alpha})`;
}

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  page: 16,
} as const;

const systemSans = Platform.select({
  ios: 'Avenir Next',
  default: 'sans-serif',
});

export const fonts = {
  display: systemSans,
  body: systemSans,
  mono: 'SpaceMono',
} as const;

export const type = {
  displayLg: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 39,
    letterSpacing: -1.25,
    fontWeight: '500',
  },
  displayMd: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.9,
    fontWeight: '500',
  },
  displaySm: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.65,
    fontWeight: '500',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    fontWeight: '500',
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.85,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 12,
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  monoSm: {
    fontFamily: fonts.mono,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.65,
  },
  bodyLg: {
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 28,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 26,
  },
  bodySm: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
} satisfies Record<string, TextStyle>;

export const softShadow: ViewStyle = Platform.select({
  android: { elevation: 3 },
  default: {
    shadowColor: '#0c1712',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
  },
}) as ViewStyle;

export const overlayShadow: ViewStyle = Platform.select({
  android: { elevation: 10 },
  default: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
  },
}) as ViewStyle;

export type Theme = {
  colors: Palette;
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = 'homeoremedica-theme';
const noop = () => undefined;
const themeStorage = (() => {
  try {
    return require('@react-native-async-storage/async-storage').default as {
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<void>;
    };
  } catch {
    let storedPreference: string | null = null;
    return {
      getItem: async () => storedPreference,
      setItem: async (_key: string, value: string) => {
        storedPreference = value;
      },
    };
  }
})();
const fallbackTheme: Theme = {
  colors: light,
  preference: 'system',
  resolvedTheme: 'light',
  isDark: false,
  setPreference: noop,
  toggleTheme: noop,
};
const ThemeContext = createContext<Theme | null>(null);

export function resolveTheme(
  preference: ThemePreference,
  systemTheme: ResolvedTheme | null | undefined,
  systemThemeReady: boolean,
): ResolvedTheme {
  if (preference !== 'system') return preference;
  return systemThemeReady && systemTheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const systemTheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemThemeReady, setSystemThemeReady] = useState(Platform.OS !== 'web');

  useEffect(() => {
    let mounted = true;
    setSystemThemeReady(true);
    themeStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (mounted && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setPreferenceState(stored);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedTheme = resolveTheme(preference, systemTheme, systemThemeReady);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    void themeStorage.setItem(THEME_STORAGE_KEY, nextPreference);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setPreference]);

  const value = useMemo<Theme>(
    () => ({
      colors: resolvedTheme === 'dark' ? dark : light,
      preference,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      setPreference,
      toggleTheme,
    }),
    [preference, resolvedTheme, setPreference, toggleTheme],
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme(): Theme {
  return useContext(ThemeContext) ?? fallbackTheme;
}

export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: Theme) => T,
): T {
  const theme = useTheme();
  return useMemo(() => StyleSheet.create(factory(theme)), [factory, theme]);
}
