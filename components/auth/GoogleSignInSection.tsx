import React from 'react';
import { View } from 'react-native';

import { GoogleIcon } from '@/components/icons/GoogleIcon';
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
        <Eyebrow style={{ marginHorizontal: 16, textTransform: 'none' }}>Or</Eyebrow>
        <View style={line} />
      </View>

      <Button
        title="Sign in with Google"
        onPress={onPress}
        loading={loading}
        variant="outline"
        icon={<GoogleIcon />}
      />
    </>
  );
}
