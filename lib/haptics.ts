import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function triggerHaptic() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}

export function withHaptic<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => TResult,
  enabled = true
) {
  return (...args: TArgs): TResult => {
    if (enabled) {
      void triggerHaptic();
    }

    return handler(...args);
  };
}
