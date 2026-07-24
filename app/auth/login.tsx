import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Body } from '@/components/ui/Type';
import { space, useTheme } from '@/constants/theme';
import { withHaptic } from '@/lib/haptics';
import { useAuthStore } from '@/lib/stores/auth-store';
import { AuthShell, AuthError, PasswordInput, GoogleSignInSection, useAuthSubmit } from '@/components/auth';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signIn, signInWithGoogle } = useAuthStore();
  const router = useRouter();
  const { isLoading, error, setError, execute } = useAuthSubmit();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    await execute(
      async () => {
        await signIn(email, password);
        router.replace('/');
      },
      { fallbackMessage: 'Login failed. Please try again.' }
    );
  };

  const handleGoogleSignIn = async () => {
    await execute(
      async () => {
        await signInWithGoogle();
        router.replace('/');
      },
      { fallbackMessage: 'Google Sign-In failed', ignoreAsyncOpInProgress: true }
    );
  };

  return (
    <AuthShell title="Sign in">
      <Input
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        icon={<Ionicons name="mail-outline" size={20} color={colors.onSurfaceVariant} />}
      />

      <PasswordInput
        label="Password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        rightLabel={
          <TouchableOpacity
            onPress={withHaptic(() => router.push('/auth/reset-password'))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Body size="sm" tone="tertiary" style={{ fontWeight: '500' }}>
              Forgot password?
            </Body>
          </TouchableOpacity>
        }
      />

      <AuthError message={error} />

      <Button title="Sign in" onPress={handleLogin} loading={isLoading} />

      <View style={{ marginVertical: space.xxl }}>
        <GoogleSignInSection onPress={handleGoogleSignIn} loading={isLoading} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: space.sm }}>
        <Body size="sm" tone="onSurfaceVariant">
          Don't have an account?{' '}
        </Body>
        <TouchableOpacity onPress={withHaptic(() => router.replace('/auth/signup'))}>
          <Body size="sm" tone="tertiary" style={{ fontWeight: '500' }}>
            Sign up free
          </Body>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}
