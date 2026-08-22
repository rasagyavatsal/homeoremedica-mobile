import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import AccountScreen from '../account';
import { useAuthStore } from '@/lib/stores/auth-store';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
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

describe('AccountScreen', () => {
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

  it('centers the account initial with stable text metrics', () => {
    const { getByText } = render(<AccountScreen />);
    const initialStyle = StyleSheet.flatten(getByText('R').props.style);

    expect(initialStyle).toEqual(
      expect.objectContaining({
        textAlign: 'center',
        fontSize: 24,
        lineHeight: 64,
      })
    );
  });

  it('shows the account identity and preferences', () => {
    const { getByText } = render(<AccountScreen />);

    expect(getByText('Rasagya')).toBeTruthy();
    expect(getByText('rasagya@example.com')).toBeTruthy();
    expect(getByText('Appearance')).toBeTruthy();
    expect(getByText('Change password')).toBeTruthy();
    expect(getByText('Log out')).toBeTruthy();
    expect(getByText('Version 1.0.0')).toBeTruthy();
  });

  it('opens sign in for an unauthenticated tab', () => {
    mockUseAuthStore.mockReturnValue({ user: null, logout: jest.fn() });

    render(<AccountScreen />);

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
