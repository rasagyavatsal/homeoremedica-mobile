import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { fonts, radius, useTheme, withAlpha } from '@/constants/theme';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export function Badge({
  children,
  variant = 'default',
  style,
}: Readonly<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}>) {
  const { colors } = useTheme();
  const palette = {
    default: {
      backgroundColor: colors.accent,
      borderColor: colors.primary,
      color: colors.accentForeground,
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderColor: withAlpha(colors.border, 0.42),
      color: colors.secondaryForeground,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: withAlpha(colors.border, 0.42),
      color: colors.onSurfaceVariant,
    },
    destructive: {
      backgroundColor: colors.secondary,
      borderColor: colors.destructive,
      color: colors.destructive,
    },
  }[variant];

  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderRadius: radius.pill,
          paddingHorizontal: 8,
          paddingVertical: 5,
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: fonts.mono,
          fontSize: 10,
          lineHeight: 11,
          fontWeight: '500',
          letterSpacing: 0.65,
          textTransform: 'uppercase',
          color: palette.color,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
