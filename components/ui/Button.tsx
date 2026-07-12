import React from 'react';
import { ActivityIndicator, Pressable, Text, TextStyle, View, ViewStyle } from 'react-native';

import { radius, useTheme, withAlpha } from '@/constants/theme';
import { splitSurfaceStyle } from '@/components/ui/Surface';
import { withHaptic } from '@/lib/haptics';

type Variant = 'primary' | 'outline' | 'ghost' | 'tertiary' | 'destructive';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  haptic?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export const Button = ({
  onPress,
  title,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  haptic = true,
  testID,
  accessibilityLabel,
}: ButtonProps) => {
  const { colors } = useTheme();
  const handlePress = withHaptic(onPress, haptic);
  const isDisabled = disabled || loading;

  const fill: Record<Variant, { bg: string; border: string; fg: string }> = {
    primary: { bg: colors.primary, border: colors.primary, fg: colors.primaryForeground },
    destructive: {
      bg: colors.destructive,
      border: colors.destructive,
      fg: colors.destructiveForeground,
    },
    outline: {
      bg: colors.surfaceBright,
      border: withAlpha(colors.foreground, 0.3),
      fg: colors.foreground,
    },
    tertiary: {
      bg: withAlpha(colors.tertiary, 0.08),
      border: withAlpha(colors.tertiary, 0.35),
      fg: colors.tertiary,
    },
    ghost: { bg: 'transparent', border: 'transparent', fg: colors.onSurfaceVariant },
  };

  const v = fill[variant];
  const [outer, inner] = splitSurfaceStyle(style);
  const radiusValue = radius.md;

  const contentBase: ViewStyle = {
    minHeight: 48,
    borderRadius: radiusValue,
    borderWidth: 1,
    borderColor: v.border,
    backgroundColor: v.bg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  };

  return (
    <View style={[outer, isDisabled ? { opacity: 0.5 } : null]}>
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          contentBase,
          inner,
          pressed && !isDisabled ? { opacity: 0.86 } : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.fg} />
        ) : (
          <>
            {icon ? <View>{icon}</View> : null}
            <Text style={[{ fontSize: 15, letterSpacing: 0.2, fontWeight: '600', color: v.fg }, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
};
