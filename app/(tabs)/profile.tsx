import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { ThemeToggle } from '@/components/ThemeToggle';
import { Surface } from '@/components/ui/Surface';
import { Body, Display, Eyebrow, Mono } from '@/components/ui/Type';
import { fonts, radius, space, useTheme, withAlpha } from '@/constants/theme';
import { useAuthStore } from '@/lib/stores/auth-store';
import { isGoogleUser } from '@/lib/auth/firebase-auth';
import { withHaptic } from '@/lib/haptics';

export default function ProfileScreen() {
  const { colors, resolvedTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const isGoogle = isGoogleUser();

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [router, user]);

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
      <Surface style={{ alignItems: 'center', padding: space.xxl, marginBottom: space.xxl }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radius.pill,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: space.lg,
          }}
        >
          <Body
            style={{
              width: 64,
              fontFamily: fonts.display,
              fontSize: 24,
              lineHeight: 64,
              fontWeight: '500',
              textAlign: 'center',
              includeFontPadding: false,
              color: colors.accentForeground,
            }}
          >
            {initial}
          </Body>
        </View>
        <Display size="sm">{user.name || 'Account'}</Display>
        <Body size="sm" tone="onSurfaceVariant" style={{ marginTop: 4 }}>
          {user.email}
        </Body>
      </Surface>

      <Eyebrow style={{ marginBottom: space.sm, marginLeft: space.xs }}>
        Preferences
      </Eyebrow>
      <Surface style={{ overflow: 'hidden', marginBottom: space.xxl }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            padding: space.lg,
            borderBottomWidth: 1,
            borderBottomColor: withAlpha(colors.border, 0.32),
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.pill,
              backgroundColor: colors.accent,
            }}
          >
            <Ionicons
              name={resolvedTheme === 'dark' ? 'moon-outline' : 'sunny-outline'}
              size={18}
              color={colors.accentForeground}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '500' }}>Appearance</Body>
            <Body size="sm" tone="onSurfaceVariant">
              {resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}
            </Body>
          </View>
          <ThemeToggle />
        </View>

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
              borderBottomColor: withAlpha(colors.border, 0.32),
              backgroundColor: pressed ? colors.accent : 'transparent',
            })}
          >
            <Ionicons name="key-outline" size={20} color={colors.onSurfaceVariant} />
            <Body style={{ flex: 1, fontWeight: '500' }}>
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
            backgroundColor: pressed ? colors.secondary : 'transparent',
          })}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Body tone="destructive" style={{ flex: 1, fontWeight: '500' }}>
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
