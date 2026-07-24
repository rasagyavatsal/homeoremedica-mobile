import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Input } from '@/components/ui/Input';
import { Body } from '@/components/ui/Type';
import { AuthShell, AuthError } from '@/components/auth';
import { space, useTheme } from '@/constants/theme';
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
      <AuthShell
        title="Check your email"
        subtitle={`Reset link sent to ${email}.`}
        showBrand={false}
      >
        <View style={{ marginBottom: space.xxl }}>
          <Callout>
            Click the link in the email to reset your password. If you do not see it, check
            your spam folder.
          </Callout>
        </View>
        <Button
          title="Back to login"
          onPress={() => router.replace('/auth/login')}
          icon={<Ionicons name="arrow-back" size={18} color={colors.primaryForeground} />}
        />
        <Button
          title="Send another email"
          variant="outline"
          onPress={() => {
            setIsSent(false);
            setEmail('');
          }}
          style={{ marginTop: space.md }}
        />
      </AuthShell>
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
    <AuthShell title="Reset your password" navHeader={navHeader} showBrand={false}>
      <Input
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        icon={<Ionicons name="mail-outline" size={20} color={colors.onSurfaceVariant} />}
      />

      <AuthError message={error} />

      <Button title="Send reset link" onPress={handleReset} loading={isLoading} style={{ marginTop: 8 }} />

      <TouchableOpacity
        style={{ alignItems: 'center', marginTop: space.xxl }}
        onPress={withHaptic(() => router.replace('/auth/login'))}
      >
        <Body size="sm" tone="onSurfaceVariant" style={{ fontWeight: '500' }}>
          ← Back to login
        </Body>
      </TouchableOpacity>
    </AuthShell>
  );
}
