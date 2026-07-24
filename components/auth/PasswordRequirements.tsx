import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { type as t, useTheme } from '@/constants/theme';
import { PASSWORD_RULES, validatePassword } from '@homeoremedica/shared';

export interface PasswordRequirementsProps {
  password: string;
  email?: string;
  displayName?: string;
  confirmPassword?: string;
  currentPassword?: string;
}

const RULES = [
  { key: 'length', label: PASSWORD_RULES.LENGTH },
  { key: 'uppercase', label: PASSWORD_RULES.UPPERCASE },
  { key: 'lowercase', label: PASSWORD_RULES.LOWERCASE },
  { key: 'number', label: PASSWORD_RULES.NUMBER },
  { key: 'symbol', label: PASSWORD_RULES.SYMBOL },
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
              name={passed ? 'checkmark' : 'close'}
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
