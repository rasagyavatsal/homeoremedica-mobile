import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { radius, type as t, useTheme, withAlpha } from '@/constants/theme';

export interface AuthErrorProps {
  message?: string;
}

export function AuthError({ message }: AuthErrorProps) {
  const { colors } = useTheme();
  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: withAlpha(colors.destructive, 0.06),
        borderWidth: 1,
        borderColor: withAlpha(colors.border, 0.4),
        borderLeftWidth: 3,
        borderLeftColor: colors.destructive,
        borderRadius: radius.sm,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 24,
      }}
    >
      <Ionicons name="alert-circle" size={18} color={colors.destructive} style={{ marginTop: 1 }} />
      <Text style={[t.body, { flex: 1, color: colors.destructive }]}>{message}</Text>
    </View>
  );
}
