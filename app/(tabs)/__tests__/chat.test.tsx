import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { sendChatMessage } from '@/lib/api/chat-service';
import { CHAT_SAFETY_NOTICE } from '@/lib/chat-answer';
import { useAuthStore } from '@/lib/stores/auth-store';

jest.mock('@/lib/api/chat-service', () => ({
  sendChatMessage: jest.fn(),
}));

const mockSendChatMessage = sendChatMessage as jest.Mock;

const mockChatSubscribers: Array<{
  onNext: (chats: any[]) => void;
  onError: (cause: unknown) => void;
}> = [];

jest.mock('@/lib/services/chat-history', () => ({
  subscribeToChats: jest.fn(
    (_userId: string, onNext: (chats: any[]) => void, onError: (cause: unknown) => void) => {
      mockChatSubscribers.push({ onNext, onError });
      return jest.fn();
    }
  ),
  createChat: jest.fn(),
  appendExchange: jest.fn(),
  loadChat: jest.fn(),
  renameChat: jest.fn(),
  deleteChat: jest.fn(),
}));

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

import {
  appendExchange,
  createChat,
  deleteChat,
  loadChat,
  renameChat,
  subscribeToChats,
} from '@/lib/services/chat-history';

const mockCreateChat = createChat as jest.Mock;
const mockAppendExchange = appendExchange as jest.Mock;
const mockLoadChat = loadChat as jest.Mock;
const mockRenameChat = renameChat as jest.Mock;
const mockDeleteChat = deleteChat as jest.Mock;
const mockSubscribeToChats = subscribeToChats as jest.Mock;

jest.mock('@/components/chat/chat-sidebar', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    ChatSidebar: ({
      chats = [],
      activeChatId,
      onNewChat,
      onSelectChat,
      onDeleteChat,
      onRenameChat,
    }: {
      chats: any[];
      activeChatId: string | null;
      onNewChat: () => void;
      onSelectChat: (chatId: string) => void;
      onDeleteChat: (chatId: string) => void;
      onRenameChat: (chatId: string, title: string) => void;
    }) => {
      return React.createElement(
        View,
        { testID: 'chat-sidebar' },
        React.createElement(
          Pressable,
          { key: 'new', onPress: onNewChat, accessibilityLabel: 'sidebar-new-chat' },
          React.createElement(Text, null, 'sidebar-new-chat')
        ),
        React.createElement(Text, null, activeChatId ?? 'no-active'),
        chats.map((chat: any) =>
          React.createElement(
            View,
            { key: chat.id },
            React.createElement(
              Pressable,
              { onPress: () => onSelectChat(chat.id), accessibilityLabel: `resume ${chat.title}` },
              React.createElement(Text, null, chat.title)
            ),
            React.createElement(
              Pressable,
              {
                onPress: () => onRenameChat(chat.id, `${chat.title} renamed`),
                accessibilityLabel: `rename ${chat.title}`,
              },
              React.createElement(Text, null, 'rename')
            ),
            React.createElement(
              Pressable,
              {
                onPress: () => onDeleteChat(chat.id),
                accessibilityLabel: `delete ${chat.title}`,
              },
              React.createElement(Text, null, 'delete')
            )
          )
        )
      );
    },
  };
});

import ChatScreen from '../index';

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: () => 0,
}));

jest.mock('@/lib/haptics', () => ({
  withHaptic: (handler: () => void) => handler,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const ANSWER_BODY = 'Nux vomica is irritable and chilly [1].';

function makeResponse(overrides: Record<string, unknown> = {}) {
  return {
    answer: `${CHAT_SAFETY_NOTICE}\n\n${ANSWER_BODY}`,
    corpusVersion: '2026-08-15.v1',
    model: 'gemini-2.5-flash-lite',
    sources: [
      {
        id: '2026-08-15.v1/kent-lectures/chk_1',
        bookId: 'kent-lectures',
        bookTitle: "Kent's Lectures on Homoeopathic Materia Medica",
        author: 'James Tyler Kent',
        remedyName: 'NUX VOMICA',
        sectionTitle: 'Mind',
        passageIndexes: [0],
        text: 'Irritable.\n\nAlways chilly.',
      },
    ],
    ...overrides,
  };
}

function typeAndSend(screen: ReturnType<typeof render>, text: string) {
  fireEvent.changeText(
    screen.getByPlaceholderText('Ask about a remedy or symptom…'),
    text
  );
  fireEvent.press(screen.getByLabelText('Send message'));
}

function emitChats(chats: any[]) {
  act(() => {
    mockChatSubscribers.forEach((subscriber) => subscriber.onNext(chats));
  });
}

const SIGNED_IN_USER = { id: 'user-1', email: 'test@example.com', name: 'Test User' };

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatSubscribers.length = 0;
    mockUseAuthStore.mockReturnValue({ user: null, logout: jest.fn() });
  });

  it('opens on an empty state with the persistent safety notice and toolbar', () => {
    const screen = render(<ChatScreen />);

    expect(screen.getByText('Ask the materia medica')).toBeTruthy();
    expect(screen.getAllByText(CHAT_SAFETY_NOTICE)).toHaveLength(1);
    expect(screen.getByLabelText('Open chat history')).toBeTruthy();
    expect(screen.getByText('New chat')).toBeTruthy();
  });

  it('opens the chat history drawer from the toolbar button', () => {
    const screen = render(<ChatScreen />);

    expect(screen.queryByTestId('chat-sidebar')).toBeNull();

    fireEvent.press(screen.getByLabelText('Open chat history'));

    expect(screen.getByTestId('chat-sidebar')).toBeTruthy();
  });

  it('sends a message and shows the answer without the repeated notice', async () => {
    mockSendChatMessage.mockResolvedValue(makeResponse());
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'How is Nux vomica described?');

    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    expect(mockSendChatMessage).toHaveBeenCalledWith({
      message: 'How is Nux vomica described?',
      history: [],
    });
    expect(screen.getByText('How is Nux vomica described?')).toBeTruthy();
    // The composer notice stays the only visible copy of the safety text.
    expect(screen.getAllByText(CHAT_SAFETY_NOTICE)).toHaveLength(1);
  });

  it('sends prior turns as history on the next question', async () => {
    mockSendChatMessage.mockResolvedValue(makeResponse());
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'First question');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    typeAndSend(screen, 'Tell me more');
    await waitFor(() =>
      expect(mockSendChatMessage).toHaveBeenLastCalledWith({
        message: 'Tell me more',
        history: [
          { role: 'user', content: 'First question' },
          { role: 'assistant', content: ANSWER_BODY },
        ],
      })
    );
  });

  it('reveals cited passages from the sources toggle', async () => {
    mockSendChatMessage.mockResolvedValue(makeResponse());
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'How is Nux vomica described?');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    expect(screen.queryByText(/Irritable\./)).toBeNull();
    fireEvent.press(screen.getByText('1 source'));

    expect(screen.getByText('Nux Vomica · Mind')).toBeTruthy();
    expect(screen.getByText('Kent lectures')).toBeTruthy();
    expect(screen.getByText(/Irritable\./)).toBeTruthy();
  });

  it('restores the draft and shows an error when the request fails', async () => {
    mockSendChatMessage.mockRejectedValue({
      code: 'UPSTREAM_UNAVAILABLE',
      message: 'The chat service could not answer right now. Please try again.',
    });
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'How is Nux vomica described?');

    await waitFor(() =>
      expect(
        screen.getByText(
          'The chat service could not answer right now. Please try again.'
        )
      ).toBeTruthy()
    );
    expect(screen.queryByText('How is Nux vomica described?')).toBeNull();
    expect(
      screen.getByPlaceholderText('Ask about a remedy or symptom…').props.value
    ).toBe('How is Nux vomica described?');
  });

  it('clears the thread with New chat', async () => {
    mockSendChatMessage.mockResolvedValue(makeResponse());
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'How is Nux vomica described?');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    fireEvent.press(screen.getByText('New chat'));

    expect(screen.queryByText(ANSWER_BODY)).toBeNull();
    expect(screen.getByText('Ask the materia medica')).toBeTruthy();
  });

  it('does not persist chats for signed-out users', async () => {
    mockSendChatMessage.mockResolvedValue(makeResponse());
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'How is Nux vomica described?');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    expect(mockSubscribeToChats).not.toHaveBeenCalled();
    expect(mockCreateChat).not.toHaveBeenCalled();
    expect(mockAppendExchange).not.toHaveBeenCalled();
  });

  it('creates a chat on the first exchange when signed in', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER, logout: jest.fn() });
    mockSendChatMessage.mockResolvedValue(makeResponse());
    mockCreateChat.mockResolvedValue({
      id: 'chat-1',
      title: 'How is Nux',
      updatedAt: null,
    });
    const screen = render(<ChatScreen />);

    expect(mockSubscribeToChats).toHaveBeenCalledWith(
      'user-1',
      expect.any(Function),
      expect.any(Function)
    );

    typeAndSend(screen, 'How is Nux vomica described?');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    expect(mockCreateChat).toHaveBeenCalledWith('user-1', [
      expect.objectContaining({ role: 'user', content: 'How is Nux vomica described?' }),
      expect.objectContaining({ role: 'assistant', content: ANSWER_BODY }),
    ]);
    await waitFor(() => {
      fireEvent.press(screen.getByLabelText('Open chat history'));
      expect(screen.getByText('chat-1')).toBeTruthy();
    });
  });

  it('appends later exchanges to the active chat', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER, logout: jest.fn() });
    mockSendChatMessage.mockResolvedValue(makeResponse());
    mockCreateChat.mockResolvedValue({
      id: 'chat-1',
      title: 'First question',
      updatedAt: null,
    });
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'First question');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    typeAndSend(screen, 'Tell me more');
    await waitFor(() =>
      expect(mockAppendExchange).toHaveBeenCalledWith('chat-1', [
        expect.objectContaining({ role: 'user', content: 'Tell me more' }),
        expect.objectContaining({ role: 'assistant', content: ANSWER_BODY }),
      ])
    );
  });

  it('resumes a chat from the history list', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER, logout: jest.fn() });
    mockLoadChat.mockResolvedValue({
      id: 'chat-9',
      userId: 'user-1',
      title: 'A past chat',
      createdAt: null,
      updatedAt: null,
      messages: [
        { id: 'm1', role: 'user', content: 'Old question' },
        { id: 'm2', role: 'assistant', content: 'Old answer' },
      ],
    });
    const screen = render(<ChatScreen />);

    fireEvent.press(screen.getByLabelText('Open chat history'));
    emitChats([{ id: 'chat-9', title: 'A past chat', updatedAt: null }]);
    fireEvent.press(screen.getByLabelText('resume A past chat'));

    await waitFor(() => expect(mockLoadChat).toHaveBeenCalledWith('chat-9'));
    expect(screen.getByText('Old question')).toBeTruthy();
    expect(screen.getByText('Old answer')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Open chat history'));
    expect(screen.getByText('chat-9')).toBeTruthy();
  });

  it('shows a history error when a chat cannot be loaded', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER, logout: jest.fn() });
    mockLoadChat.mockRejectedValue(new Error('permission-denied'));
    const screen = render(<ChatScreen />);

    fireEvent.press(screen.getByLabelText('Open chat history'));
    emitChats([{ id: 'chat-9', title: 'A past chat', updatedAt: null }]);
    fireEvent.press(screen.getByLabelText('resume A past chat'));

    await waitFor(() => expect(screen.getByText('permission-denied')).toBeTruthy());
  });

  it('deletes the active chat and clears the thread', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER, logout: jest.fn() });
    mockSendChatMessage.mockResolvedValue(makeResponse());
    mockCreateChat.mockResolvedValue({
      id: 'chat-1',
      title: 'How is Nux',
      updatedAt: null,
    });
    mockDeleteChat.mockResolvedValue(undefined);
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'How is Nux vomica described?');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Open chat history'));
    emitChats([{ id: 'chat-1', title: 'How is Nux', updatedAt: null }]);
    fireEvent.press(screen.getByLabelText('delete How is Nux'));

    await waitFor(() => expect(mockDeleteChat).toHaveBeenCalledWith('chat-1'));
    expect(screen.queryByText(ANSWER_BODY)).toBeNull();
    expect(screen.getByText('Ask the materia medica')).toBeTruthy();
  });

  it('deleting another chat keeps the current thread', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER, logout: jest.fn() });
    mockSendChatMessage.mockResolvedValue(makeResponse());
    mockCreateChat.mockResolvedValue({
      id: 'chat-1',
      title: 'First question',
      updatedAt: null,
    });
    mockDeleteChat.mockResolvedValue(undefined);
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'First question');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Open chat history'));
    emitChats([
      { id: 'chat-1', title: 'First question', updatedAt: null },
      { id: 'chat-2', title: 'Older chat', updatedAt: null },
    ]);
    fireEvent.press(screen.getByLabelText('delete Older chat'));

    await waitFor(() => expect(mockDeleteChat).toHaveBeenCalledWith('chat-2'));
    expect(screen.getByText(ANSWER_BODY)).toBeTruthy();
  });

  it('renames a chat from the sidebar', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER, logout: jest.fn() });
    mockRenameChat.mockResolvedValue(undefined);
    const screen = render(<ChatScreen />);

    fireEvent.press(screen.getByLabelText('Open chat history'));
    emitChats([{ id: 'chat-1', title: 'How is Nux', updatedAt: null }]);
    fireEvent.press(screen.getByLabelText('rename How is Nux'));

    await waitFor(() =>
      expect(mockRenameChat).toHaveBeenCalledWith('chat-1', 'How is Nux renamed')
    );
  });

  it('shows a history error when a chat cannot be renamed', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER, logout: jest.fn() });
    mockRenameChat.mockRejectedValue(new Error('permission-denied'));
    const screen = render(<ChatScreen />);

    fireEvent.press(screen.getByLabelText('Open chat history'));
    emitChats([{ id: 'chat-1', title: 'How is Nux', updatedAt: null }]);
    fireEvent.press(screen.getByLabelText('rename How is Nux'));

    await waitFor(() =>
      expect(
        screen.getByText('That chat could not be renamed. Please try again.')
      ).toBeTruthy()
    );
  });
});
