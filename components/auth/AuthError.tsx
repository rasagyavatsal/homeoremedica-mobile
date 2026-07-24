import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Callout } from '@/components/ui/Callout';
import { Body } from '@/components/ui/Type';
import { useTheme } from '@/constants/theme';

export interface AuthErrorProps {
  message?: string;
}

export function AuthError({ message }: AuthErrorProps) {
  const { colors } = useTheme();
  if (!message) return null;

  return (
    <View style={{ marginBottom: 24 }}>
      <Callout
        variant="destructive"
        icon={<Ionicons name="alert-circle-outline" size={18} color={colors.destructive} />}
      >
        <Body size="sm" tone="destructive">
          {message}
        </Body>
      </Callout>
    </View>
  );
}
