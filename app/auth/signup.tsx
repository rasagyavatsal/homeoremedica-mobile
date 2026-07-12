import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Body, Mono } from '@/components/ui/Type';
import { space, useTheme } from '@/constants/theme';
import { withHaptic } from '@/lib/haptics';
import { useAuthStore } from '@/lib/stores/auth-store';
import { validatePassword, PASSWORD_RULES } from '@homeoremedica/shared';
import { AuthShell, AuthError, PasswordInput, PasswordRequirements, GoogleSignInSection, useAuthSubmit } from '@/components/auth';

export default function SignupScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signUp, signInWithGoogle } = useAuthStore();
  const router = useRouter();
  const { isLoading, error, setError, execute } = useAuthSubmit();

  const handleSignup = async () => {
    if (!email || !password || !name) {
      setError('Please fill in all fields');
      return;
    }

    const result = validatePassword({ password, email, displayName: name });

    if (!result.isValid) {
      const failedMessages = result.unmetRules
        .map((key) => PASSWORD_RULES[key.toUpperCase() as keyof typeof PASSWORD_RULES])
        .join('. ');
      setError(`Password does not meet requirements: ${failedMessages}`);
      return;
    }

    await execute(
      async () => {
        await signUp(email, password, name);
        router.replace('/');
      },
      { fallbackMessage: 'Signup failed. Please try again.' }
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
    <AuthShell title="Create account">
      <Input
        label="Name"
        placeholder="John Doe"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        icon={<Ionicons name="person-outline" size={20} color={colors.onSurfaceVariant} />}
      />

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
        placeholder="Create password"
        value={password}
        onChangeText={setPassword}
      />

      <PasswordRequirements password={password} email={email} displayName={name} />

      <AuthError message={error} />

      <Button title="Create account" onPress={handleSignup} loading={isLoading} />

      <View style={{ marginVertical: space.xxl }}>
        <GoogleSignInSection onPress={handleGoogleSignIn} loading={isLoading} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: space.sm }}>
        <Body size="sm" tone="onSurfaceVariant">
          Already have an account?{' '}
        </Body>
        <TouchableOpacity onPress={withHaptic(() => router.replace('/auth/login'))}>
          <Mono small tone="tertiary">
            Sign in
          </Mono>
        </TouchableOpacity>
      </View>
    </AuthShell>
  );
}
