import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import ProfileScreen from '../profile';
import { useAuthStore } from '@/lib/stores/auth-store';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/auth/firebase-auth', () => ({
  isGoogleUser: jest.fn(() => false),
}));

jest.mock('@/lib/haptics', () => ({
  withHaptic: (fn: () => void) => fn,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.0.0' },
}));

describe('ProfileScreen', () => {
  const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: {
        name: 'Rasagya',
        email: 'rasagya@example.com',
      },
      logout: jest.fn(),
    });
  });

  it('centers the profile initial with stable text metrics', () => {
    const { getByText } = render(<ProfileScreen />);
    const initialStyle = StyleSheet.flatten(getByText('R').props.style);

    expect(initialStyle).toEqual(
      expect.objectContaining({
        textAlign: 'center',
        fontSize: 30,
        lineHeight: 72,
      })
    );
  });
});
