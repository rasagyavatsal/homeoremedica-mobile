import React, { useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { useTheme } from '@/constants/theme';
import { withHaptic } from '@/lib/haptics';
import { useAuthStore } from '@/lib/stores/auth-store';
import { validatePassword } from '@homeoremedica/shared';
import { AuthShell, AuthError, PasswordInput, PasswordRequirements, useAuthSubmit } from '@/components/auth';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { changePassword, logout, user } = useAuthStore();
  const router = useRouter();
  const { isLoading, error, setError, execute } = useAuthSubmit();

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const result = validatePassword({
      password: newPassword,
      confirmPassword,
      currentPassword,
      email: user?.email,
      displayName: user?.name,
    });

    if (!result.isValid) {
      const failedMessages = result.unmetRules
        .map((key) => result.rules[key as keyof typeof result.rules]?.message)
        .filter(Boolean)
        .join('. ');
      setError(`Password does not meet requirements: ${failedMessages}`);
      return;
    }

    await execute(
      async () => {
        await changePassword(currentPassword, newPassword);
        Alert.alert(
          'Success',
          'Password updated successfully! Please sign in again with your new password.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                router.replace('/auth/login');
              },
            },
          ]
        );
      },
      { fallbackMessage: 'Failed to change password' }
    );
  };

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
    <AuthShell title="Change password" navHeader={navHeader} showBrand={false}>
      <PasswordInput
        label="Current password"
        placeholder="Enter current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />

      <PasswordInput
        label="New password"
        placeholder="Create password"
        value={newPassword}
        onChangeText={setNewPassword}
        icon={<Ionicons name="key-outline" size={20} color={colors.onSurfaceVariant} />}
      />

      <PasswordRequirements
        password={newPassword}
        confirmPassword={confirmPassword}
        currentPassword={currentPassword}
        email={user?.email}
        displayName={user?.name}
      />

      <PasswordInput
        label="Confirm new password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.onSurfaceVariant} />}
      />

      <AuthError message={error} />

      <Button
        title="Update password"
        onPress={handleChangePassword}
        loading={isLoading}
        style={{ marginTop: 8 }}
      />
    </AuthShell>
  );
}
