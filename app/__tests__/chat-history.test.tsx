import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@/lib/haptics', () => ({
  withHaptic: (handler: () => void) => handler,
}));

const mockRouter = { push: jest.fn(), back: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

let subscriptionOnNext: ((chats: { id: string; title: string; updatedAt: null }[]) => void) | null = null;
let subscriptionOnError: ((cause: unknown) => void) | null = null;

jest.mock('@/lib/chat-history', () => ({
  subscribeToChats: jest.fn(
    (
      _userId: string,
      onNext: (chats: { id: string; title: string; updatedAt: null }[]) => void,
      onError: (cause: unknown) => void
    ) => {
      subscriptionOnNext = onNext;
      subscriptionOnError = onError;
      return () => {
        subscriptionOnNext = null;
        subscriptionOnError = null;
      };
    }
  ),
  deleteChat: jest.fn().mockResolvedValue(undefined),
  formatChatDate: () => 'Mar 4',
}));

import { deleteChat } from '@/lib/chat-history';

const mockDeleteChat = deleteChat as jest.Mock;

const mockUseAuthStore = jest.fn();

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { user: unknown }) => unknown) =>
    selector(mockUseAuthStore()),
}));

import { useChatHistoryStore } from '@/lib/stores/chat-history-store';

import ChatHistoryScreen from '../chat-history';

const SIGNED_IN_USER = { id: 'user-1', email: 'test@example.com', name: 'Test User' };
const CHATS = [
  { id: 'chat-1', title: 'Nux vomica in fevers', updatedAt: null },
  { id: 'chat-2', title: 'Arsenicum anxiety', updatedAt: null },
];

describe('ChatHistoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER });
    useChatHistoryStore.setState({ activeChatId: null, resumeNonce: 0 });
  });

  it('lists every chat with its title and date', () => {
    const screen = render(<ChatHistoryScreen />);

    expect(subscriptionOnNext).not.toBeNull();
    act(() => subscriptionOnNext?.(CHATS));

    expect(screen.getByText('Nux vomica in fevers')).toBeTruthy();
    expect(screen.getByText('Arsenicum anxiety')).toBeTruthy();
    expect(screen.getAllByText(/Mar 4/).length).toBeGreaterThan(0);
  });

  it('resumes a chat and returns to the chat screen', () => {
    const screen = render(<ChatHistoryScreen />);
    act(() => subscriptionOnNext?.(CHATS));

    fireEvent.press(screen.getByLabelText('Resume chat Nux vomica in fevers'));

    expect(useChatHistoryStore.getState().activeChatId).toBe('chat-1');
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('starts a new chat and returns to the chat screen', () => {
    const screen = render(<ChatHistoryScreen />);

    fireEvent.press(screen.getByText('New chat'));

    expect(useChatHistoryStore.getState().activeChatId).toBeNull();
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('deletes a chat after confirmation and clears it when active', async () => {
    useChatHistoryStore.setState({ activeChatId: 'chat-2', resumeNonce: 0 });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const screen = render(<ChatHistoryScreen />);
    act(() => subscriptionOnNext?.(CHATS));

    fireEvent.press(screen.getByLabelText('Delete chat Arsenicum anxiety'));

    expect(alertSpy).toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0]?.[2] as
      | { text: string; onPress?: () => void }[]
      | undefined;
    const deleteButton = buttons?.find((button) => button.text === 'Delete');
    deleteButton?.onPress?.();

    await waitFor(() => expect(mockDeleteChat).toHaveBeenCalledWith('chat-2'));
    expect(useChatHistoryStore.getState().activeChatId).toBeNull();
  });

  it('keeps the active chat when a different chat is deleted', async () => {
    useChatHistoryStore.setState({ activeChatId: 'chat-1', resumeNonce: 0 });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const screen = render(<ChatHistoryScreen />);
    act(() => subscriptionOnNext?.(CHATS));

    fireEvent.press(screen.getByLabelText('Delete chat Arsenicum anxiety'));

    const buttons = alertSpy.mock.calls[0]?.[2] as
      | { text: string; onPress?: () => void }[]
      | undefined;
    buttons?.find((button) => button.text === 'Delete')?.onPress?.();

    await waitFor(() => expect(mockDeleteChat).toHaveBeenCalledWith('chat-2'));
    expect(useChatHistoryStore.getState().activeChatId).toBe('chat-1');
  });

  it('shows an error when the subscription fails', () => {
    const screen = render(<ChatHistoryScreen />);

    act(() => subscriptionOnError?.(new Error('permission-denied')));

    expect(
      screen.getByText('Your chat history could not be loaded. Please try again.')
    ).toBeTruthy();
  });

  it('shows an empty state when there are no chats', () => {
    const screen = render(<ChatHistoryScreen />);

    act(() => subscriptionOnNext?.([]));

    expect(screen.getByText('No chats yet.')).toBeTruthy();
  });

  it('prompts signed-out users to sign in', () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    const screen = render(<ChatHistoryScreen />);

    expect(screen.getByText('Sign in to see your chats')).toBeTruthy();

    fireEvent.press(screen.getByText('Sign in'));

    expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
  });
});
