import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { radius, useTheme, withAlpha } from '@/constants/theme';

/**
 * Bottom sheet (default) or left-docked side drawer primitive. Mirrors the
 * web app's ui/sheet.tsx variants:
 * - "bottom"  → web `sheet`: full-width panel anchored to the bottom with
 *               rounded top corners.
 * - "side"    → web `sheetSide`: full-height panel docked left at 3/4 of
 *               the screen width, used for the mobile chat-history drawer.
 * Both sit on a 70% scrim (web: bg-scrim/70) that closes on tap.
 */
export type SheetVariant = 'bottom' | 'side';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  variant?: SheetVariant;
  children: React.ReactNode;
}

const SIDE_SHEET_WIDTH_RATIO = 0.75;
const ENTRANCE_DURATION_MS = 220;

export function Sheet({
  open,
  onClose,
  variant = 'bottom',
  children,
}: SheetProps) {
  const { colors } = useTheme();
  const { height, width } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: ENTRANCE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    }
  }, [open, progress]);

  if (!open) return null;

  const sideWidth = width * SIDE_SHEET_WIDTH_RATIO;
  const scrimOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const slide = progress.interpolate({
    inputRange: [0, 1],
    outputRange: variant === 'side' ? [-sideWidth, 0] : [height, 0],
  });

  const panel: object =
    variant === 'side'
      ? {
          ...styles.side,
          width: sideWidth,
          backgroundColor: colors.background,
          borderRightColor: withAlpha(colors.border, 0.42),
          transform: [{ translateX: slide }],
        }
      : {
          ...styles.bottom,
          maxHeight: height * 0.92,
          backgroundColor: colors.card,
          borderColor: withAlpha(colors.border, 0.42),
          transform: [{ translateY: slide }],
        };

  return (
    <Modal
      transparent
      visible
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: withAlpha(colors.scrim, 0.7), opacity: scrimOpacity },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
          />
        </Animated.View>

        <Animated.View style={panel} accessibilityViewIsModal>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {children}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  side: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: 1,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
});
