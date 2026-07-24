import React from 'react';
import { render } from '@testing-library/react-native';
import SignupScreen from '../signup';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({
    signUp: jest.fn(),
    signInWithGoogle: jest.fn(),
  }),
}));

describe('SignupScreen', () => {
  it('shows the web signup password guidance', () => {
    const { getByPlaceholderText } = render(<SignupScreen />);
    expect(getByPlaceholderText('Min 12 characters')).toBeTruthy();
  });

  it('Form rejects password with only 11 characters', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);
    
    // Fill in fields
    const nameInput = getByPlaceholderText('Your name');
    const emailInput = getByPlaceholderText('your@email.com');
    const passwordInput = getByPlaceholderText('Min 12 characters');

    // Using fireEvent since userEvent from RTL is not standard in native always.
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'Short1!pass'); // 11 characters
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'Short1!pass');
    
    const createAccountButton = getByText('Create account');
    fireEvent.press(createAccountButton);
    
    // Look for error message containing "12 characters"
    const errorMsg = await findByText(
      'Password does not meet requirements: At least 12 characters',
    );
    expect(errorMsg).toBeTruthy();
  });

  it('Real-time checklist renders when password has content and hides when empty', () => {
    const { getByPlaceholderText, queryByText, getByText } = render(<SignupScreen />);
    
    // initially hidden
    expect(queryByText('At least 12 characters')).toBeNull();
    
    const passwordInput = getByPlaceholderText('Min 12 characters');
    const { fireEvent } = require('@testing-library/react-native');

    // type password, checklist appears
    fireEvent.changeText(passwordInput, 'a');
    expect(getByText('At least 12 characters')).toBeTruthy();
    expect(getByText('One uppercase letter (A-Z)')).toBeTruthy();
    
    // clear password, checklist hides
    fireEvent.changeText(passwordInput, '');
    expect(queryByText('At least 12 characters')).toBeNull();
  });

  it('Form rejects password without uppercase letter', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('Your name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Min 12 characters'), 'short1!passlong'); // 15 chars, no upper
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'short1!passlong');
    
    fireEvent.press(getByText('Create account'));
    const errorMsg = await findByText(/Password does not meet requirements.*uppercase/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects password without lowercase letter', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('Your name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Min 12 characters'), 'SHORT1!PASSLONG'); // 15 chars, no lower
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'SHORT1!PASSLONG');
    
    fireEvent.press(getByText('Create account'));
    const errorMsg = await findByText(/Password does not meet requirements.*lowercase/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects password without number', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('Your name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Min 12 characters'), 'Short!passlong'); // no number
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'Short!passlong');
    
    fireEvent.press(getByText('Create account'));
    const errorMsg = await findByText(/Password does not meet requirements.*number/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects password without symbol', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('Your name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Min 12 characters'), 'Short1passlong'); // no symbol
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'Short1passlong');
    
    fireEvent.press(getByText('Create account'));
    const errorMsg = await findByText(/Password does not meet requirements.*symbol/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form submits successfully with valid password meeting all rules', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('Your name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Min 12 characters'), 'Valid1!Password'); // meets all rules
    
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'Valid1!Password');
    fireEvent.press(getByText('Create account'));
    expect(queryByText(/Password does not meet requirements/i)).toBeNull();
  });

  it('requires the password confirmation to match', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');

    fireEvent.changeText(getByPlaceholderText('Your name'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Min 12 characters'), 'Valid1!Password');
    fireEvent.changeText(getByPlaceholderText('Confirm password'), 'Different1!Password');

    fireEvent.press(getByText('Create account'));

    expect(await findByText('Passwords do not match')).toBeTruthy();
  });
});
