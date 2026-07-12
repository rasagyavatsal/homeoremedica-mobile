import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ChangePasswordScreen from '../change-password';
import { useAuthStore } from '@/lib/stores/auth-store';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/haptics', () => ({
  withHaptic: (fn: any) => fn,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('ChangePasswordScreen', () => {
  beforeEach(() => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      changePassword: jest.fn(),
      logout: jest.fn(),
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  });

  it('Placeholder shows "Create password"', () => {
    const { getByPlaceholderText } = render(<ChangePasswordScreen />);
    expect(getByPlaceholderText('Create password')).toBeTruthy();
  });

  it('does not render the change-password subtitle', () => {
    const { queryByText } = render(<ChangePasswordScreen />);

    expect(queryByText('Update your password to keep your account secure')).toBeNull();
  });

  it('Form rejects new password with only 11 characters', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<ChangePasswordScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    
    fireEvent.changeText(getByPlaceholderText('Enter current password'), 'OldPassword123!');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'Short1!pass'); // 11 characters
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'Short1!pass');
    
    fireEvent.press(getByText('Update password'));
    
    const errorMsg = await findByText(/Password does not meet requirements.*12 characters/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects new password without uppercase letter', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<ChangePasswordScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.changeText(getByPlaceholderText('Enter current password'), 'OldPassword123!');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'short1!passlong');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'short1!passlong');
    fireEvent.press(getByText('Update password'));
    const errorMsg = await findByText(/Password does not meet requirements.*uppercase/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects new password without lowercase letter', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<ChangePasswordScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.changeText(getByPlaceholderText('Enter current password'), 'OldPassword123!');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'SHORT1!PASSLONG');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'SHORT1!PASSLONG');
    fireEvent.press(getByText('Update password'));
    const errorMsg = await findByText(/Password does not meet requirements.*lowercase/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects new password without number', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<ChangePasswordScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.changeText(getByPlaceholderText('Enter current password'), 'OldPassword123!');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'Short!passlong');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'Short!passlong');
    fireEvent.press(getByText('Update password'));
    const errorMsg = await findByText(/Password does not meet requirements.*number/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects new password without symbol', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<ChangePasswordScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.changeText(getByPlaceholderText('Enter current password'), 'OldPassword123!');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'Short1passlong');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'Short1passlong');
    fireEvent.press(getByText('Update password'));
    const errorMsg = await findByText(/Password does not meet requirements.*symbol/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects new password same as current password', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<ChangePasswordScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.changeText(getByPlaceholderText('Enter current password'), 'OldPassword123!');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'OldPassword123!');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'OldPassword123!');
    fireEvent.press(getByText('Update password'));
    const errorMsg = await findByText(/Password does not meet requirements.*different from current/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form rejects new password containing email prefix', async () => {
    const { getByPlaceholderText, getByText, findByText } = render(<ChangePasswordScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.changeText(getByPlaceholderText('Enter current password'), 'OldPassword123!');
    // email is test@example.com from the mock
    fireEvent.changeText(getByPlaceholderText('Create password'), 'test1!Passlong');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'test1!Passlong');
    fireEvent.press(getByText('Update password'));
    const errorMsg = await findByText(/Password does not meet requirements.*personal information/i);
    expect(errorMsg).toBeTruthy();
  });

  it('Form submits successfully with valid new password meeting all rules', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<ChangePasswordScreen />);
    const { fireEvent } = require('@testing-library/react-native');
    fireEvent.changeText(getByPlaceholderText('Enter current password'), 'OldPassword123!');
    fireEvent.changeText(getByPlaceholderText('Create password'), 'Valid1!Password');
    fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'Valid1!Password');
    
    const mockAuthStore = require('@/lib/stores/auth-store').useAuthStore;
    const { changePassword } = mockAuthStore();
    
    fireEvent.press(getByText('Update password'));
    
    expect(queryByText(/Password does not meet requirements/i)).toBeNull();
    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith('OldPassword123!', 'Valid1!Password');
    });
  });

  it('Real-time checklist renders when password has content and hides when empty', () => {
    const { getByPlaceholderText, queryByText, getByText } = render(<ChangePasswordScreen />);
    
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
});
