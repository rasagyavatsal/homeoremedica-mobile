import React from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';

import { space, useTheme } from '@/constants/theme';
import { Body, Display } from '@/components/ui/Type';

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  navHeader?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, navHeader, children }: AuthShellProps) {
  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView
      behavior="height"
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {navHeader}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.xxl, paddingTop: navHeader ? space.xl : 60 }}
      >
        <View style={{ marginBottom: 36 }}>
          <Display size="lg">{title}</Display>
          {subtitle ? (
            <Body tone="onSurfaceVariant" style={{ marginTop: space.lg }}>
              {subtitle}
            </Body>
          ) : null}
        </View>

        <View style={{ width: '100%' }}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
