import React from 'react';
import { render } from '@testing-library/react-native';
import { PasswordRequirements } from '../PasswordRequirements';

describe('PasswordRequirements', () => {
  it('renders rules when password is not empty', () => {
    const { getByText } = render(
      <PasswordRequirements 
        password="a" 
        email="test@test.com" 
        displayName="John Doe" 
      />
    );
    expect(getByText('At least 12 characters')).toBeTruthy();
    expect(getByText('One uppercase letter (A-Z)')).toBeTruthy();
  });

  it('renders nothing when password is empty', () => {
    const { queryByText } = render(
      <PasswordRequirements 
        password="" 
        email="test@test.com" 
        displayName="John Doe" 
      />
    );
    expect(queryByText('At least 12 characters')).toBeNull();
  });
});
