import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { space, useTheme } from '@/constants/theme';
import { Body, Display } from '@/components/ui/Type';

interface ErrorStateProps {
  title?: string;
  message?: string;
}

export const ErrorState = ({ title = 'Database Error', message }: ErrorStateProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        backgroundColor: colors.background,
      }}
    >
      <Ionicons name="alert-circle-outline" size={56} color={colors.destructive} />
      <Display size="sm" tone="destructive" style={{ marginTop: space.lg, textAlign: 'center' }}>
        {title}
      </Display>
      {message ? (
        <Body size="sm" tone="onSurfaceVariant" style={{ marginTop: space.sm, textAlign: 'center' }}>
          {message}
        </Body>
      ) : null}
    </View>
  );
};
