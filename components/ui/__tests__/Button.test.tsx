import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Button } from '../Button';

jest.mock('@/lib/haptics', () => ({
  withHaptic: (handler: () => void) => handler,
}));

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button onPress={() => {}} title="Click Me" />
    );
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} title="Click Me" />
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress} title="Click Me" disabled />
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading prop is true', () => {
    const { queryByText } = render(
      <Button onPress={() => {}} title="Click Me" loading />
    );
    
    expect(queryByText('Click Me')).toBeNull();
  });

  it('uses the web control height and rounded geometry', () => {
    const { getByTestId } = render(
      <Button onPress={() => {}} title="Click Me" testID="quiet-button" />
    );

    const style = StyleSheet.flatten(getByTestId('quiet-button').props.style);
    expect(style).toEqual(expect.objectContaining({ minHeight: 44, borderRadius: 14 }));
  });

  it('renders without an offset shadow layer', () => {
    const { toJSON } = render(
      <Button onPress={() => {}} title="Click Me" />
    );

    expect(JSON.stringify(toJSON())).not.toContain('translateX');
    expect(JSON.stringify(toJSON())).not.toContain('translateY');
  });
});
