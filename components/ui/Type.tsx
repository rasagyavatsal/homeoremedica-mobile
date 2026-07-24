import * as React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { type as t, useTheme } from '@/constants/theme';

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

export function Eyebrow({ tone = 'onSurfaceVariant', style, ...props }: TextVariantProps) {
  const color = useTone(tone);
  return <Text style={[t.eyebrow, { color }, style]} {...props} />;
}

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
