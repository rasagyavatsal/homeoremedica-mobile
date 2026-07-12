import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { triggerHaptic, withHaptic } from '../haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

// We need to mock Platform differently for Jest if we want to change it per test
// Or just mock it once if that's easier.
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}));

describe('haptics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerHaptic', () => {
    it('should call Haptics.impactAsync on Android', async () => {
      Platform.OS = 'android';
      await triggerHaptic();
      expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    });

    it('should not call Haptics.impactAsync on web', async () => {
      Platform.OS = 'web';
      await triggerHaptic();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      Platform.OS = 'android';
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('Haptic failed'));
      
      await triggerHaptic();
      
      expect(warnSpy).toHaveBeenCalledWith('Haptic feedback failed:', expect.any(Error));
      warnSpy.mockRestore();
    });
  });

  describe('withHaptic', () => {
    it('should call triggerHaptic when enabled', () => {
      Platform.OS = 'android';
      const handler = jest.fn().mockReturnValue('result');
      const enhancedHandler = withHaptic(handler, true);
      
      const result = enhancedHandler('arg1');
      
      expect(Haptics.impactAsync).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith('arg1');
      expect(result).toBe('result');
    });

    it('should skip triggerHaptic when disabled', () => {
      Platform.OS = 'android';
      const handler = jest.fn();
      const enhancedHandler = withHaptic(handler, false);
      
      enhancedHandler();
      
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });
  });
});
