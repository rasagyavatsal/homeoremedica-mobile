import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { type as t, useTheme } from '@/constants/theme';
import { validatePassword } from '@homeoremedica/shared';

export interface PasswordRequirementsProps {
  password: string;
  email?: string;
  displayName?: string;
  confirmPassword?: string;
  currentPassword?: string;
}

const RULES = [
  { key: 'length', label: '12+ characters' },
  { key: 'uppercase', label: 'Uppercase letter' },
  { key: 'lowercase', label: 'Lowercase letter' },
  { key: 'number', label: 'Number' },
  { key: 'symbol', label: 'Symbol' },
] as const;

export function PasswordRequirements({
  password,
  email,
  displayName,
  confirmPassword,
  currentPassword,
}: PasswordRequirementsProps) {
  const { colors } = useTheme();
  if (!password || password.length === 0) return null;

  const result = validatePassword({ password, email, displayName, confirmPassword, currentPassword });

  return (
    <View style={{ marginTop: -8, marginBottom: 16, paddingHorizontal: 2, gap: 8 }}>
      {RULES.map((rule) => {
        const passed = result.rules[rule.key as keyof typeof result.rules]?.passed;
        return (
          <View key={rule.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons
              name={passed ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={passed ? colors.success : colors.onSurfaceVariant}
            />
            <Text style={[t.bodySm, { color: passed ? colors.success : colors.onSurfaceVariant }]}>
              {rule.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
