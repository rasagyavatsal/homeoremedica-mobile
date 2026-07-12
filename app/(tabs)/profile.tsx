import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { Surface } from '@/components/ui/Surface';
import { Body, Display, Mono } from '@/components/ui/Type';
import { fonts, radius, space, useTheme, withAlpha } from '@/constants/theme';
import { useAuthStore } from '@/lib/stores/auth-store';
import { isGoogleUser } from '@/lib/auth/firebase-auth';
import { withHaptic } from '@/lib/haptics';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const isGoogle = isGoogleUser();

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const initial = user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: space.page }}
    >
      <Surface style={{ alignItems: 'center', paddingVertical: 32, marginBottom: space.xxl }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: withAlpha(colors.primary, 0.35),
            backgroundColor: withAlpha(colors.primary, 0.1),
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.lg,
          }}
        >
          <Body
            style={{
              width: 72,
              fontFamily: fonts.displaySemibold,
              fontSize: 30,
              lineHeight: 72,
              textAlign: 'center',
              includeFontPadding: false,
              color: colors.primary,
            }}
          >
            {initial}
          </Body>
        </View>
        <Display size="md">{user.name || 'User'}</Display>
        <Mono small style={{ marginTop: 4 }}>
          {user.email}
        </Mono>
      </Surface>

      <Surface style={{ overflow: 'hidden', marginBottom: space.xxl }}>
        {!isGoogle ? (
          <Pressable
            onPress={withHaptic(() => router.push('/auth/change-password'))}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Change password"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              padding: space.lg,
              borderBottomWidth: 1,
              borderBottomColor: withAlpha(colors.border, 0.25),
              backgroundColor: pressed ? withAlpha(colors.foreground, 0.04) : 'transparent',
            })}
          >
            <Ionicons name="key-outline" size={20} color={colors.onSurfaceVariant} />
            <Body size="lg" style={{ flex: 1, fontWeight: '600' }}>
              Change password
            </Body>
            <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={withHaptic(handleLogout)}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            padding: space.lg,
            backgroundColor: pressed ? withAlpha(colors.destructive, 0.06) : 'transparent',
          })}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Body size="lg" tone="destructive" style={{ flex: 1, fontWeight: '600' }}>
            Log out
          </Body>
        </Pressable>
      </Surface>

      <Mono small style={{ textAlign: 'center', marginBottom: 32 }}>
        Version {Constants.expoConfig?.version || '1.0.0'}
      </Mono>
    </ScrollView>
  );
}
