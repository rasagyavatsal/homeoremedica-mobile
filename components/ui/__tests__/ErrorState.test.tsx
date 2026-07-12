import React from 'react';
import { render } from '@testing-library/react-native';
import { ErrorState } from '../ErrorState';

describe('ErrorState', () => {
  it('renders title and message correctly', () => {
    const { getByText } = render(
      <ErrorState title="Database Error" message="Failed to load database" />
    );
    expect(getByText('Database Error')).toBeTruthy();
    expect(getByText('Failed to load database')).toBeTruthy();
  });
});
