import React, { useState } from 'react';
import { StyleProp, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { fonts, radius, useTheme, withAlpha } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  rightLabel?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = ({
  label,
  error,
  containerStyle,
  icon,
  rightLabel,
  rightElement,
  onFocus,
  onBlur,
  style,
  placeholderTextColor,
  ...props
}: InputProps) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.destructive
    : focused
      ? colors.primary
      : withAlpha(colors.border, 0.42);

  return (
    <View style={[{ marginBottom: 20, width: '100%' }, containerStyle]}>
      {label ? (
        <View
          style={{
            minHeight: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: colors.foreground,
              fontFamily: fonts.body,
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '500',
            }}
          >
            {label}
          </Text>
          {rightLabel}
        </View>
      ) : null}

      <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
        {icon ? (
          <View style={{ position: 'absolute', left: 14, zIndex: 1 }}>{icon}</View>
        ) : null}

        <TextInput
          style={[
            {
              flex: 1,
              minHeight: 44,
              borderWidth: 1,
              borderColor,
              borderRadius: radius.md,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontFamily: fonts.body,
              fontSize: 16,
              color: colors.foreground,
              backgroundColor: colors.surfaceBright,
            },
            !!icon && { paddingLeft: 44 },
            !!rightElement && { paddingRight: 44 },
            style,
          ]}
          placeholderTextColor={placeholderTextColor ?? withAlpha(colors.onSurfaceVariant, 0.6)}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {rightElement ? (
          <View style={{ position: 'absolute', right: 14, zIndex: 1 }}>{rightElement}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.destructive, marginTop: 6 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};
