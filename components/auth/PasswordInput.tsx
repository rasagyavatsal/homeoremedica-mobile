import React, { useState } from 'react';
import { TextInputProps, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/constants/theme';
import { Input } from '../ui/Input';
import { withHaptic } from '@/lib/haptics';

export interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry' | 'rightElement'> {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  icon?: React.ReactNode;
}

export function PasswordInput({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  ...props
}: PasswordInputProps) {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const defaultIcon = icon || (
    <Ionicons name="lock-closed-outline" size={20} color={colors.onSurfaceVariant} />
  );

  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!showPassword}
      icon={defaultIcon}
      autoCapitalize="none"
      rightElement={
        <TouchableOpacity
          onPress={withHaptic(() => setShowPassword(!showPassword))}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      }
      {...props}
    />
  );
}
