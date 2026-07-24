import React from 'react';
import { AccessibilityRole, View } from 'react-native';

import { Body } from '@/components/ui/Type';
import { radius, useTheme, withAlpha } from '@/constants/theme';

type CalloutVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive';

export function Callout({
  children,
  icon,
  variant = 'default',
}: Readonly<{
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: CalloutVariant;
}>) {
  const { colors } = useTheme();
  const palette = {
    default: {
      backgroundColor: colors.surfaceBright,
      borderColor: withAlpha(colors.border, 0.42),
      color: colors.onSurfaceVariant,
    },
    info: {
      backgroundColor: colors.accent,
      borderColor: colors.primary,
      color: colors.onSurfaceVariant,
    },
    success: {
      backgroundColor: colors.accent,
      borderColor: colors.success,
      color: colors.successForeground,
    },
    warning: {
      backgroundColor: colors.secondary,
      borderColor: colors.warning,
      color: colors.warningForeground,
    },
    destructive: {
      backgroundColor: colors.secondary,
      borderColor: colors.destructive,
      color: colors.destructive,
    },
  }[variant];
  const role: AccessibilityRole | undefined = variant === 'destructive' ? 'alert' : undefined;

  return (
    <View
      accessibilityRole={role}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: palette.borderColor,
        backgroundColor: palette.backgroundColor,
      }}
    >
      {icon ? <View style={{ marginTop: 2 }}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        {typeof children === 'string' ? (
          <Body size="sm" style={{ color: palette.color }}>
            {children}
          </Body>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
