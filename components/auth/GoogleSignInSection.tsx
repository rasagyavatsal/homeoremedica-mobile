import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme, withAlpha } from '@/constants/theme';
import { Button } from '../ui/Button';
import { Eyebrow } from '../ui/Type';

export interface GoogleSignInSectionProps {
  onPress: () => void;
  loading: boolean;
}

export function GoogleSignInSection({ onPress, loading }: GoogleSignInSectionProps) {
  const { colors } = useTheme();
  const line = { flex: 1, height: 1, backgroundColor: withAlpha(colors.border, 0.45) };

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
        <View style={line} />
        <Eyebrow style={{ marginHorizontal: 16 }}>OR</Eyebrow>
        <View style={line} />
      </View>

      <Button
        title="Continue with Google"
        onPress={onPress}
        loading={loading}
        variant="outline"
        icon={<Ionicons name="logo-google" size={18} color={colors.tertiary} />}
      />
    </>
  );
}
