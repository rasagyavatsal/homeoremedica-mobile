import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { BrandLockup } from '@/components/BrandLockup';
import { Surface } from '@/components/ui/Surface';
import { space, useTheme } from '@/constants/theme';
import { Body, Display } from '@/components/ui/Type';

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  navHeader?: React.ReactNode;
  showBrand?: boolean;
  children: React.ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  navHeader,
  showBrand = true,
  children,
}: AuthShellProps) {
  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {navHeader}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: space.page,
          paddingVertical: space.xxl,
        }}
      >
        {showBrand ? (
          <View style={{ marginBottom: space.xxl }}>
            <BrandLockup />
          </View>
        ) : null}

        <Surface style={{ width: '100%', maxWidth: 512, overflow: 'hidden' }}>
          <View
            style={{
              padding: space.xl,
              paddingBottom: space.lg,
              borderBottomWidth: subtitle ? 1 : 0,
              borderBottomColor: colors.outlineVariant,
              gap: 6,
            }}
          >
            <Display size="sm">{title}</Display>
            {subtitle ? (
              <Body size="sm" tone="onSurfaceVariant">
                {subtitle}
              </Body>
            ) : null}
          </View>

          <View style={{ width: '100%', padding: space.xl, paddingTop: space.lg }}>
            {children}
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
