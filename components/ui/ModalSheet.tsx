import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Display } from '@/components/ui/Type';
import { overlayShadow, radius, space, useTheme, withAlpha } from '@/constants/theme';
import { withHaptic } from '@/lib/haptics';

export function ModalSheet({
  visible,
  onClose,
  title,
  description,
  icon,
  children,
}: Readonly<{
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}>) {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView
          pointerEvents="box-none"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            onPress={onClose}
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: withAlpha(colors.scrim, isDark ? 0.72 : 0.48),
            }}
          />

          <View
            style={[
              {
                maxHeight: '92%',
                overflow: 'hidden',
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                borderWidth: 1,
                borderBottomWidth: 0,
                borderColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
                backgroundColor: colors.card,
              },
              overlayShadow,
            ]}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: space.md,
                padding: space.xl,
                borderBottomWidth: 1,
                borderBottomColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
              }}
            >
              {icon ? (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.accent,
                  }}
                >
                  {icon}
                </View>
              ) : null}

              <View style={{ flex: 1, gap: 4 }}>
                <Display size="sm">{title}</Display>
                {description ? (
                  <Body size="sm" tone="onSurfaceVariant">
                    {description}
                  </Body>
                ) : null}
              </View>

              <Pressable
                onPress={withHaptic(onClose)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                style={({ pressed }) => ({
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.md,
                  backgroundColor: pressed ? colors.accent : 'transparent',
                })}
              >
                <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ padding: space.xl }}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
