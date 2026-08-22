import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ChatSidebar } from '../chat-sidebar';
import { isGoogleUser } from '@/lib/auth/firebase-auth';
import { useAuthStore } from '@/lib/stores/auth-store';

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/auth/firebase-auth', () => ({
  isGoogleUser: jest.fn(() => false),
}));

jest.mock('@/lib/services/chat-history', () => ({
  CHAT_TITLE_MAX_LENGTH: 60,
  formatChatDate: () => 'Mar 4',
}));

jest.mock('@/lib/haptics', () => ({
  withHaptic: (handler: () => void) => handler,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockIsGoogleUser = isGoogleUser as unknown as jest.Mock;

const CHATS = [
  { id: 'chat-1', title: 'Nux vomica in fevers', updatedAt: null },
  { id: 'chat-2', title: 'Arsenicum anxiety', updatedAt: null },
];

function renderSidebar(
  overrides: Partial<React.ComponentProps<typeof ChatSidebar>> = {}
) {
  const props = {
    user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
    chats: CHATS,
    activeChatId: null,
    isResuming: false,
    onNewChat: jest.fn(),
    onSelectChat: jest.fn(),
    onDeleteChat: jest.fn(),
    onRenameChat: jest.fn(),
    ...overrides,
  };
  const screen = render(<ChatSidebar {...props} />);
  return { screen, props };
}

describe('ChatSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsGoogleUser.mockReturnValue(false);
    mockUseAuthStore.mockReturnValue({ logout: jest.fn().mockResolvedValue(undefined) });
  });

  it('lists every chat with its title and formatted date', () => {
    const { screen } = renderSidebar();

    expect(screen.getByLabelText('Chat history')).toBeTruthy();
    expect(screen.getByText('Recents')).toBeTruthy();
    expect(screen.getByText('Nux vomica in fevers')).toBeTruthy();
    expect(screen.getByText('Arsenicum anxiety')).toBeTruthy();
    expect(screen.getAllByText('Mar 4')).toHaveLength(2);
  });

  it('marks the active chat', () => {
    const { screen } = renderSidebar({ activeChatId: 'chat-2' });

    expect(screen.getByLabelText('Arsenicum anxiety').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByLabelText('Nux vomica in fevers').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('starts a new chat', () => {
    const { screen, props } = renderSidebar();

    fireEvent.press(screen.getByText('New chat'));

    expect(props.onNewChat).toHaveBeenCalled();
  });

  it('selects a chat', () => {
    const { screen, props } = renderSidebar();

    fireEvent.press(screen.getByText('Nux vomica in fevers'));

    expect(props.onSelectChat).toHaveBeenCalledWith('chat-1');
  });

  it('selecting a chat also closes the surrounding sheet', () => {
    const onNavigate = jest.fn();
    const { screen } = renderSidebar({ onNavigate });

    fireEvent.press(screen.getByText('Nux vomica in fevers'));

    expect(onNavigate).toHaveBeenCalled();
  });

  it('deletes a chat after confirming in the sheet', () => {
    const { screen, props } = renderSidebar();

    fireEvent.press(screen.getByLabelText('Chat options for Arsenicum anxiety'));
    fireEvent.press(screen.getByText('Delete chat'));

    expect(
      screen.getByText(
        '"Arsenicum anxiety" will be permanently deleted. This cannot be undone.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Delete'));

    expect(props.onDeleteChat).toHaveBeenCalledWith('chat-2');
  });

  it('cancels a pending delete without deleting', () => {
    const { screen, props } = renderSidebar();

    fireEvent.press(screen.getByLabelText('Chat options for Arsenicum anxiety'));
    fireEvent.press(screen.getByText('Delete chat'));
    fireEvent.press(screen.getByText('Cancel'));

    expect(props.onDeleteChat).not.toHaveBeenCalled();
  });

  it('renames a chat from the options sheet', () => {
    const { screen, props } = renderSidebar();

    fireEvent.press(screen.getByLabelText('Chat options for Nux vomica in fevers'));
    fireEvent.press(screen.getByText('Rename'));

    const input = screen.getByLabelText('Chat title');
    expect(input.props.value).toBe('Nux vomica in fevers');

    fireEvent.changeText(input, 'Nux in fevers');
    fireEvent.press(screen.getByText('Save'));

    expect(props.onRenameChat).toHaveBeenCalledWith('chat-1', 'Nux in fevers');
  });

  it('ignores an unchanged or blank rename', () => {
    const { screen, props } = renderSidebar();

    fireEvent.press(screen.getByLabelText('Chat options for Nux vomica in fevers'));
    fireEvent.press(screen.getByText('Rename'));

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Chat title'), '   ');
    expect(save.props.accessibilityState.disabled).toBe(true);

    expect(props.onRenameChat).not.toHaveBeenCalled();
  });

  it('shows an empty state when there are no chats', () => {
    const { screen } = renderSidebar({ chats: [] });

    expect(screen.getByText('Recents')).toBeTruthy();
    expect(screen.getByText('No chats yet.')).toBeTruthy();
  });

  it('prompts signed-out users to sign in', () => {
    const onNavigate = jest.fn();
    const { screen } = renderSidebar({ user: null, chats: [], onNavigate });

    expect(screen.getByText('Sign in to save your chats')).toBeTruthy();

    fireEvent.press(screen.getByText('Sign in'));

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
    expect(onNavigate).toHaveBeenCalled();
  });

  it('shows the brand lockup at the top of the sidebar', () => {
    const { screen } = renderSidebar();

    expect(screen.getByLabelText('HomeoRemedica home')).toBeTruthy();
    expect(screen.getByText('HomeoRemedica')).toBeTruthy();
  });

  it('shows the signed-in account at the bottom of the sidebar', () => {
    const { screen } = renderSidebar();

    const account = screen.getByLabelText('Account menu');
    expect(account).toBeTruthy();
    expect(screen.getByText('Test User')).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('offers change password and log out from the account sheet', async () => {
    const logout = jest.fn().mockResolvedValue(undefined);
    mockUseAuthStore.mockReturnValue({ logout });
    const { screen } = renderSidebar();

    fireEvent.press(screen.getByLabelText('Account menu'));

    const changePassword = screen.getByText('Change password');
    expect(changePassword).toBeTruthy();

    fireEvent.press(changePassword);
    expect(mockPush).toHaveBeenCalledWith('/auth/change-password');

    fireEvent.press(screen.getByLabelText('Account menu'));
    fireEvent.press(screen.getByText('Log out'));

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('hides change password for Google-only accounts', () => {
    mockIsGoogleUser.mockReturnValue(true);
    const { screen } = renderSidebar();

    fireEvent.press(screen.getByLabelText('Account menu'));

    expect(screen.queryByText('Change password')).toBeNull();
    expect(screen.getByText('Log out')).toBeTruthy();
  });
});
