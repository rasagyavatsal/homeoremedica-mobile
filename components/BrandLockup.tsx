import React from 'react';
import { Image, Text, View } from 'react-native';

import { sizes, space, type, useTheme } from '@/constants/theme';

export function BrandLockup({ compact = false }: Readonly<{ compact?: boolean }>) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
      <View style={{ width: sizes.logo, height: sizes.logo, overflow: 'hidden' }}>
        <Image
          source={
            isDark
              ? require('../assets/images/logo-dark-transparent.png')
              : require('../assets/images/logo-light-transparent.png')
          }
          resizeMode="contain"
          style={{
            width: sizes.logo * 1.2,
            height: sizes.logo * 1.2,
            marginLeft: -space.xs,
            marginTop: -space.xs,
          }}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
      {compact ? null : (
        <Text
          numberOfLines={1}
          style={[{ ...type.title }, { color: colors.foreground }]}
        >
          HomeoRemedica
        </Text>
      )}
    </View>
  );
}
