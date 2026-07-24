import React from 'react';
import { Image, Text, View } from 'react-native';

import { fonts, useTheme } from '@/constants/theme';

export function BrandLockup({ compact = false }: Readonly<{ compact?: boolean }>) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 40, height: 40, overflow: 'hidden' }}>
        <Image
          source={
            isDark
              ? require('../assets/images/logo-dark-transparent.png')
              : require('../assets/images/logo-light-transparent.png')
          }
          resizeMode="contain"
          style={{ width: 48, height: 48, marginLeft: -4, marginTop: -4 }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
      {compact ? null : (
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.display,
            fontSize: 20,
            lineHeight: 24,
            fontWeight: '500',
            letterSpacing: -0.6,
            color: colors.foreground,
          }}
        >
          HomeoRemedica
        </Text>
      )}
    </View>
  );
}
