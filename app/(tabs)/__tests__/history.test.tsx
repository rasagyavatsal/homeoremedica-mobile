import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { useAuthStore } from '@/lib/stores/auth-store';
import { useChatStore } from '@/lib/stores/chat-store';

const mockNavigate = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
    push: mockPush,
  }),
}));

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@/lib/stores/chat-store', () => ({
  useChatStore: jest.fn(),
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
const mockUseChatStore = useChatStore as unknown as jest.Mock;

import HistoryScreen from '../history';

function setAuthUser(user: unknown) {
  mockUseAuthStore.mockImplementation((selector: (state: any) => unknown) =>
    selector({ user })
  );
}

const CHATS = [
  { id: 'chat-1', title: 'Nux vomica in fevers', updatedAt: null },
  { id: 'chat-2', title: 'Arsenicum anxiety', updatedAt: null },
];

function makeChatState(overrides: Record<string, unknown> = {}) {
  return {
    chats: CHATS,
    activeChatId: null,
    resumingChatId: null,
    startNewChat: jest.fn(),
    resumeChat: jest.fn(),
    deleteChat: jest.fn(),
    renameChat: jest.fn(),
    ...overrides,
  };
}

function renderHistory(overrides: Record<string, unknown> = {}) {
  mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
    selector(makeChatState(overrides))
  );
  return render(<HistoryScreen />);
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthUser({ id: 'user-1', email: 'test@example.com', name: 'Test User' });
  });

  it('lists every chat with its title and formatted date', () => {
    const screen = renderHistory();

    expect(screen.getByLabelText('Chat history')).toBeTruthy();
    expect(screen.getByText('Recents')).toBeTruthy();
    expect(screen.getByText('Nux vomica in fevers')).toBeTruthy();
    expect(screen.getByText('Arsenicum anxiety')).toBeTruthy();
    expect(screen.getAllByText('Mar 4')).toHaveLength(2);
  });

  it('marks the active chat', () => {
    const screen = renderHistory({ activeChatId: 'chat-2' });

    expect(screen.getByLabelText('Arsenicum anxiety').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByLabelText('Nux vomica in fevers').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('starts a new chat and returns to the chat tab', () => {
    const chatState = makeChatState();
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(chatState)
    );
    const screen = render(<HistoryScreen />);

    fireEvent.press(screen.getByText('New chat'));

    expect(chatState.startNewChat).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('resumes a chat and returns to the chat tab', () => {
    const chatState = makeChatState();
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(chatState)
    );
    const screen = render(<HistoryScreen />);

    fireEvent.press(screen.getByText('Nux vomica in fevers'));

    expect(chatState.resumeChat).toHaveBeenCalledWith('chat-1');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('deletes a chat after confirming in the sheet', () => {
    const chatState = makeChatState();
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(chatState)
    );
    const screen = render(<HistoryScreen />);

    fireEvent.press(screen.getByLabelText('Chat options for Arsenicum anxiety'));
    fireEvent.press(screen.getByText('Delete chat'));

    expect(
      screen.getByText(
        '"Arsenicum anxiety" will be permanently deleted. This cannot be undone.'
      )
    ).toBeTruthy();

    fireEvent.press(screen.getByText('Delete'));

    expect(chatState.deleteChat).toHaveBeenCalledWith('chat-2');
  });

  it('cancels a pending delete without deleting', () => {
    const chatState = makeChatState();
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(chatState)
    );
    const screen = render(<HistoryScreen />);

    fireEvent.press(screen.getByLabelText('Chat options for Arsenicum anxiety'));
    fireEvent.press(screen.getByText('Delete chat'));
    fireEvent.press(screen.getByText('Cancel'));

    expect(chatState.deleteChat).not.toHaveBeenCalled();
  });

  it('renames a chat from the options sheet', () => {
    const chatState = makeChatState();
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(chatState)
    );
    const screen = render(<HistoryScreen />);

    fireEvent.press(screen.getByLabelText('Chat options for Nux vomica in fevers'));
    fireEvent.press(screen.getByText('Rename'));

    const input = screen.getByLabelText('Chat title');
    expect(input.props.value).toBe('Nux vomica in fevers');

    fireEvent.changeText(input, 'Nux in fevers');
    fireEvent.press(screen.getByText('Save'));

    expect(chatState.renameChat).toHaveBeenCalledWith('chat-1', 'Nux in fevers');
  });

  it('ignores an unchanged or blank rename', () => {
    const chatState = makeChatState();
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(chatState)
    );
    const screen = render(<HistoryScreen />);

    fireEvent.press(screen.getByLabelText('Chat options for Nux vomica in fevers'));
    fireEvent.press(screen.getByText('Rename'));

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Chat title'), '   ');
    expect(save.props.accessibilityState.disabled).toBe(true);

    expect(chatState.renameChat).not.toHaveBeenCalled();
  });

  it('shows an empty state when there are no chats', () => {
    const screen = renderHistory({ chats: [] });

    expect(screen.getByText('Recents')).toBeTruthy();
    expect(screen.getByText('No chats yet.')).toBeTruthy();
  });

  it('prompts signed-out users to sign in', () => {
    setAuthUser(null);
    const screen = renderHistory({ chats: [] });

    expect(screen.getByText('Sign in to save your chats')).toBeTruthy();

    fireEvent.press(screen.getByText('Sign in'));

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
});
