import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Body, Display, Mono } from '@/components/ui/Type';
import { AuthShell, AuthError } from '@/components/auth';
import { radius, space, useTheme, withAlpha } from '@/constants/theme';
import { sendPasswordReset } from '@/lib/auth/firebase-auth';
import { withHaptic } from '@/lib/haptics';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await sendPasswordReset(email);
      setIsSent(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
          padding: space.xxl,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: withAlpha(colors.primary, 0.35),
            backgroundColor: withAlpha(colors.primary, 0.1),
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: space.xxl,
          }}
        >
          <Ionicons name="mail-unread-outline" size={40} color={colors.primary} />
        </View>
        <Display size="md" style={{ textAlign: 'center' }}>
          Check your email
        </Display>
        <Body tone="onSurfaceVariant" style={{ textAlign: 'center', marginTop: space.md, marginBottom: space.xxl }}>
          We've sent password reset instructions to {email}.
        </Body>
        <Button title="Back to sign in" onPress={() => router.replace('/auth/login')} style={{ width: '100%' }} />
      </View>
    );
  }

  const navHeader = (
    <View style={{ paddingTop: 40, paddingHorizontal: 16 }}>
      <TouchableOpacity
        onPress={withHaptic(() => router.back())}
        style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' }}
      >
        <Ionicons name="arrow-back" size={24} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );

  return (
    <AuthShell title="Reset password" navHeader={navHeader}>
      <Input
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        icon={<Ionicons name="mail-outline" size={20} color={colors.onSurfaceVariant} />}
      />

      <AuthError message={error} />

      <Button title="Send instructions" onPress={handleReset} loading={isLoading} style={{ marginTop: 8 }} />

      <TouchableOpacity
        style={{ alignItems: 'center', marginTop: space.xxl }}
        onPress={withHaptic(() => router.replace('/auth/login'))}
      >
        <Mono small tone="tertiary">
          Back to sign in
        </Mono>
      </TouchableOpacity>
    </AuthShell>
  );
}
