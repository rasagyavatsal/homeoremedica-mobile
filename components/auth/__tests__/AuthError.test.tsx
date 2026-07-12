import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthError } from '../AuthError';

describe('AuthError', () => {
  it('renders error message when message is provided', () => {
    const { getByText } = render(
      <AuthError message="An error occurred" />
    );
    expect(getByText('An error occurred')).toBeTruthy();
  });

  it('renders nothing when message is empty or undefined', () => {
    const { queryByText } = render(
      <AuthError message="" />
    );
    expect(queryByText('An error occurred')).toBeNull();
  });
});
