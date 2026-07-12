import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PasswordInput } from '../PasswordInput';

jest.mock('@/lib/haptics', () => ({
  withHaptic: (handler: () => void) => handler,
}));

describe('PasswordInput', () => {
  it('renders correctly with label and placeholder', () => {
    const { getByText, getByPlaceholderText } = render(
      <PasswordInput 
        label="Password Test" 
        placeholder="Enter hidden value" 
        value="" 
        onChangeText={() => {}} 
      />
    );
    expect(getByText('Password Test')).toBeTruthy();
    expect(getByPlaceholderText('Enter hidden value')).toBeTruthy();
  });

  it('calls onChangeText when text is entered', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <PasswordInput 
        label="Password" 
        placeholder="Enter password" 
        value="" 
        onChangeText={onChangeText} 
      />
    );
    
    fireEvent.changeText(getByPlaceholderText('Enter password'), 'my-password');
    expect(onChangeText).toHaveBeenCalledWith('my-password');
  });
});
