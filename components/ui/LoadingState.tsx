import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/constants/theme';
import { Mono } from '@/components/ui/Type';

interface LoadingStateProps {
  text?: string;
}

export const LoadingState = ({ text = 'Loading database...' }: LoadingStateProps) => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Mono style={{ marginTop: 16 }}>{text}</Mono>
    </View>
  );
};
