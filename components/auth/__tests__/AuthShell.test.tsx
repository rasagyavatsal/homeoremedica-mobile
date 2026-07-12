import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import { AuthShell } from '../AuthShell';

describe('AuthShell', () => {
  it('renders title and children correctly', () => {
    const { getByText } = render(
      <AuthShell title="Test Title" subtitle="Test Subtitle">
        <Text>Form Content</Text>
      </AuthShell>
    );

    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Subtitle')).toBeTruthy();
    expect(getByText('Form Content')).toBeTruthy();
  });

  it('does not render a decorative double rule under the heading', () => {
    const { UNSAFE_queryAllByType } = render(
      <AuthShell title="Test Title">
        <Text>Form Content</Text>
      </AuthShell>
    );

    const hasDoubleRule = UNSAFE_queryAllByType(View).some((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.height === 3 && style.borderTopWidth === 1 && style.borderBottomWidth === 1;
    });

    expect(hasDoubleRule).toBe(false);
  });

  it('renders navHeader when provided', () => {
    const { getByText } = render(
      <AuthShell title="Test Title" navHeader={<Text>Back Button</Text>}>
        <Text>Form Content</Text>
      </AuthShell>
    );

    expect(getByText('Back Button')).toBeTruthy();
  });
});
