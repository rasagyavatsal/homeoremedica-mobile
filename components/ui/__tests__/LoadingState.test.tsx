import React from 'react';
import { render } from '@testing-library/react-native';
import { LoadingState } from '../LoadingState';

describe('LoadingState', () => {
  it('renders loading indicator and default text', () => {
    const { getByText } = render(<LoadingState />);
    expect(getByText('Loading database...')).toBeTruthy();
  });

  it('renders configurable loading text', () => {
    const { getByText } = render(<LoadingState text="Loading remedies..." />);
    expect(getByText('Loading remedies...')).toBeTruthy();
  });
});
