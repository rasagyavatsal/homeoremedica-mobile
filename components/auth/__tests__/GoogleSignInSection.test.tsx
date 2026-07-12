import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GoogleSignInSection } from '../GoogleSignInSection';

jest.mock('@/lib/haptics', () => ({
  withHaptic: (handler: () => void) => handler,
}));

describe('GoogleSignInSection', () => {
  it('renders Google sign-in button and divider correctly', () => {
    const { getByText } = render(
      <GoogleSignInSection onPress={() => {}} loading={false} />
    );
    expect(getByText('OR')).toBeTruthy();
    expect(getByText('Continue with Google')).toBeTruthy();
  });

  it('calls onPress when Google button is clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <GoogleSignInSection onPress={onPress} loading={false} />
    );
    
    fireEvent.press(getByText('Continue with Google'));
    expect(onPress).toHaveBeenCalled();
  });
});
