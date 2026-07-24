import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, useTheme, withAlpha } from '@/constants/theme';
import { withHaptic } from '@/lib/haptics';

export function ThemeToggle() {
  const { colors, isDark, toggleTheme } = useTheme();

  return (
    <Pressable
      onPress={withHaptic(toggleTheme)}
      accessibilityRole="button"
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: withAlpha(colors.border, 0.42),
        backgroundColor: pressed ? colors.accent : 'transparent',
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      <Ionicons
        name={isDark ? 'moon-outline' : 'sunny-outline'}
        size={18}
        color={colors.foreground}
      />
    </Pressable>
  );
}
