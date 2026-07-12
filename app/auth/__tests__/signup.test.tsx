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
  it('Placeholder shows "Create password"', () => {
    const { getByPlaceholderText } = render(<SignupScreen />);
    expect(getByPlaceholderText('Create password')).toBeTruthy();
  });

  it('Form rejects password with only 11 characters', async () => {
    const { getByPlaceholderText, getAllByText, findByText } = render(<SignupScreen />);
    
    // Fill in fields
    const nameInput = getByPlaceholderText('John Doe');
    const emailInput = getByPlaceholderText('your@email.com');
    const passwordInput = getByPlaceholderText('Create password');

    // Using fireEvent since userEvent from RTL is not standard in native always.
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'Short1!pass'); // 11 characters
    
    const createAccountButton = getAllByText('Create account')[1];
    fireEvent.press(createAccountButton);
    
    // Look for error message containing "12 characters"
    const errorMsg = await findByText(/12 characters/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Real-time checklist renders when password has content and hides when empty', () => {
    const { getByPlaceholderText, queryByText, getByText } = render(<SignupScreen />);
    
    // initially hidden
    expect(queryByText('12+ characters')).toBeNull();
    
    const passwordInput = getByPlaceholderText('Create password');
    const { fireEvent } = require('@testing-library/react-native');

    // type password, checklist appears
    fireEvent.changeText(passwordInput, 'a');
    expect(getByText('12+ characters')).toBeTruthy();
    expect(getByText('Uppercase letter')).toBeTruthy();
    
    // clear password, checklist hides
    fireEvent.changeText(passwordInput, '');
    expect(queryByText('12+ characters')).toBeNull();
  });

  it('Form rejects password without uppercase letter', async () => {
    const { getByPlaceholderText, getAllByText, findByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('John Doe'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'short1!passlong'); // 15 chars, no upper
    
    fireEvent.press(getAllByText('Create account')[1]);
    const errorMsg = await findByText(/Password does not meet requirements.*uppercase/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects password without lowercase letter', async () => {
    const { getByPlaceholderText, getAllByText, findByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('John Doe'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'SHORT1!PASSLONG'); // 15 chars, no lower
    
    fireEvent.press(getAllByText('Create account')[1]);
    const errorMsg = await findByText(/Password does not meet requirements.*lowercase/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects password without number', async () => {
    const { getByPlaceholderText, getAllByText, findByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('John Doe'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'Short!passlong'); // no number
    
    fireEvent.press(getAllByText('Create account')[1]);
    const errorMsg = await findByText(/Password does not meet requirements.*number/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects password without symbol', async () => {
    const { getByPlaceholderText, getAllByText, findByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('John Doe'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'Short1passlong'); // no symbol
    
    fireEvent.press(getAllByText('Create account')[1]);
    const errorMsg = await findByText(/Password does not meet requirements.*symbol/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form submits successfully with valid password meeting all rules', async () => {
    const { getByPlaceholderText, getAllByText, queryByText } = render(<SignupScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('John Doe'), 'Test User');
    fireEvent.changeText(getByPlaceholderText('your@email.com'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'Valid1!Password'); // meets all rules
    
    fireEvent.press(getAllByText('Create account')[1]);
    expect(queryByText(/Password does not meet requirements/i)).toBeNull();
  });
});
