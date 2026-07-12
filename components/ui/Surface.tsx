import * as React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { radius as radii, useTheme, withAlpha } from '@/constants/theme';

type Tone = 'card' | 'surface' | 'bright' | 'lowest' | 'low' | 'high';

/* Layout properties stay on the outer wrapper; content geometry stays inside. */
const OUTER_KEYS = new Set<string>([
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginHorizontal',
  'marginVertical',
  'marginStart',
  'marginEnd',
  'alignSelf',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'start',
  'end',
  'zIndex',
  'opacity',
  'display',
]);

export function splitSurfaceStyle(style?: StyleProp<ViewStyle>): [ViewStyle, ViewStyle] {
  const flat = (StyleSheet.flatten(style) || {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {};
  const inner: Record<string, unknown> = {};
  for (const key of Object.keys(flat)) {
    (OUTER_KEYS.has(key) ? outer : inner)[key] = flat[key];
  }
  return [outer as ViewStyle, inner as ViewStyle];
}

export interface SurfaceProps extends ViewProps {
  /** Draw the hairline ink border that frames every ledger surface. */
  bordered?: boolean;
  radius?: keyof typeof radii;
  tone?: Tone;
}

/* A ledger surface: warm card stock framed by a hairline ink rule. */
export function Surface({
  bordered = true,
  radius = 'md',
  tone = 'card',
  style,
  children,
  ...props
}: SurfaceProps) {
  const { colors } = useTheme();
  const radiusValue = radii[radius];

  const background = {
    card: colors.card,
    surface: colors.surface,
    bright: colors.surfaceBright,
    lowest: colors.surfaceLowest,
    low: colors.surfaceLow,
    high: colors.surfaceHigh,
  }[tone];

  const [outer, inner] = splitSurfaceStyle(style);

  const content: ViewStyle = {
    backgroundColor: background,
    borderRadius: radiusValue,
  };
  if (bordered) {
    content.borderWidth = 1;
    content.borderColor = withAlpha(colors.border, 0.45);
  }

  return (
    <View style={outer}>
      <View style={[content, inner]} {...props}>
        {children}
      </View>
    </View>
  );
}
