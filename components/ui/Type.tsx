import * as React from 'react';
import { StyleProp, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';

import { fonts, type as t, useTheme, withAlpha } from '@/constants/theme';

type Tone =
  | 'foreground'
  | 'onSurfaceVariant'
  | 'mutedForeground'
  | 'primary'
  | 'tertiary'
  | 'destructive'
  | 'success';

function useTone(tone: Tone): string {
  const { colors } = useTheme();
  return colors[tone];
}

interface TextVariantProps extends TextProps {
  tone?: Tone;
  style?: StyleProp<TextStyle>;
}

/* Didot/Bodoni-style serif headings. */
export function Display({
  size = 'md',
  tone = 'foreground',
  style,
  ...props
}: TextVariantProps & { size?: 'sm' | 'md' | 'lg' }) {
  const color = useTone(tone);
  const variant = size === 'lg' ? t.displayLg : size === 'sm' ? t.displaySm : t.displayMd;
  return <Text style={[variant, { color }, style]} {...props} />;
}

/* Mono small-caps "specimen label". */
export function Eyebrow({ tone = 'onSurfaceVariant', style, ...props }: TextVariantProps) {
  const color = useTone(tone);
  return <Text style={[t.eyebrow, { color }, style]} {...props} />;
}

/* Mono metadata (counts, dates, source tags). */
export function Mono({
  tone = 'onSurfaceVariant',
  small,
  style,
  ...props
}: TextVariantProps & { small?: boolean }) {
  const color = useTone(tone);
  return <Text style={[small ? t.monoSm : t.mono, { color }, style]} {...props} />;
}

export function Body({
  tone = 'foreground',
  size = 'md',
  style,
  ...props
}: TextVariantProps & { size?: 'sm' | 'md' | 'lg' }) {
  const color = useTone(tone);
  const variant = size === 'lg' ? t.bodyLg : size === 'sm' ? t.bodySm : t.body;
  return <Text style={[variant, { color }, style]} {...props} />;
}

/* Printer's rules. */
export function Rule({
  variant = 'hairline',
  style,
}: {
  variant?: 'hairline' | 'heavy' | 'double';
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();

  if (variant === 'double') {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          {
            height: 3,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: withAlpha(colors.foreground, 0.55),
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        variant === 'heavy'
          ? { height: 2, backgroundColor: withAlpha(colors.foreground, 0.8) }
          : { height: 1, backgroundColor: withAlpha(colors.border, 0.45) },
        style,
      ]}
    />
  );
}

/* Printer's section break: hairlines flanking a fleuron. */
export function OrnamentRule({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{ flexDirection: 'row', alignItems: 'center' }, style]}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: withAlpha(colors.border, 0.45) }} />
      <Text
        style={{
          fontFamily: fonts.displayRegular,
          fontSize: 18,
          lineHeight: 20,
          marginHorizontal: 14,
          color: withAlpha(colors.tertiary, 0.8),
        }}
      >
        ❧
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: withAlpha(colors.border, 0.45) }} />
    </View>
  );
}
