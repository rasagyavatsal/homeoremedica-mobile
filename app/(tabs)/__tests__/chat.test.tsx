import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { sendChatMessage } from '@/lib/api/chat-service';
import { CHAT_SAFETY_NOTICE } from '@/lib/chat-answer';

jest.mock('@/lib/api/chat-service', () => ({
  sendChatMessage: jest.fn(),
}));

const mockSendChatMessage = sendChatMessage as jest.Mock;

jest.mock('@/lib/chat-history', () => ({
  createChat: jest.fn(),
  appendExchange: jest.fn(),
  loadChat: jest.fn(),
}));

import { appendExchange, createChat, loadChat } from '@/lib/chat-history';

const mockCreateChat = createChat as jest.Mock;
const mockAppendExchange = appendExchange as jest.Mock;
const mockLoadChat = loadChat as jest.Mock;

const mockUseAuthStore = jest.fn();

jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: (selector: (state: { user: unknown }) => unknown) =>
    selector(mockUseAuthStore()),
}));

import { useChatHistoryStore } from '@/lib/stores/chat-history-store';

import ChatScreen from '../chat';

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
const SIGNED_IN_USER = { id: 'user-1', email: 'test@example.com', name: 'Test User' };

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

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: null });
    useChatHistoryStore.setState({ activeChatId: null, resumeNonce: 0 });
  });

  it('opens on an empty state with the persistent safety notice', () => {
    const screen = render(<ChatScreen />);

    expect(screen.getByText('Ask the materia medica')).toBeTruthy();
    expect(screen.getAllByText(CHAT_SAFETY_NOTICE)).toHaveLength(1);
    expect(screen.queryByText('New chat')).toBeNull();
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

    expect(mockCreateChat).not.toHaveBeenCalled();
    expect(mockAppendExchange).not.toHaveBeenCalled();
  });

  it('creates a chat on the first exchange when signed in', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER });
    mockSendChatMessage.mockResolvedValue(makeResponse());
    mockCreateChat.mockResolvedValue({
      id: 'chat-1',
      title: 'How is Nux vomica described?',
      updatedAt: null,
    });
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'How is Nux vomica described?');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    expect(mockCreateChat).toHaveBeenCalledWith('user-1', [
      expect.objectContaining({ role: 'user', content: 'How is Nux vomica described?' }),
      expect.objectContaining({ role: 'assistant', content: ANSWER_BODY }),
    ]);
    expect(useChatHistoryStore.getState().activeChatId).toBe('chat-1');
  });

  it('appends later exchanges to the active chat', async () => {
    mockUseAuthStore.mockReturnValue({ user: SIGNED_IN_USER });
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

  it('resumes a chat requested by the history screen', async () => {
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

    act(() => useChatHistoryStore.getState().resumeChat('chat-9'));

    await waitFor(() => expect(mockLoadChat).toHaveBeenCalledWith('chat-9'));
    expect(screen.getByText('Old question')).toBeTruthy();
    expect(screen.getByText('Old answer')).toBeTruthy();
  });

  it('shows a history error when a resumed chat is missing', async () => {
    mockLoadChat.mockResolvedValue(null);
    const screen = render(<ChatScreen />);

    act(() => useChatHistoryStore.getState().resumeChat('chat-missing'));

    await waitFor(() =>
      expect(screen.getByText('That chat no longer exists.')).toBeTruthy()
    );
  });

  it('clears the thread when the history screen starts a new chat', async () => {
    mockSendChatMessage.mockResolvedValue(makeResponse());
    const screen = render(<ChatScreen />);

    typeAndSend(screen, 'How is Nux vomica described?');
    await waitFor(() => expect(screen.getByText(ANSWER_BODY)).toBeTruthy());

    act(() => useChatHistoryStore.getState().clearActiveChat());

    await waitFor(() => expect(screen.queryByText(ANSWER_BODY)).toBeNull());
    expect(screen.getByText('Ask the materia medica')).toBeTruthy();
  });
});
