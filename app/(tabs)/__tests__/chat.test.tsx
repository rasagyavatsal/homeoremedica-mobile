import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { sendChatMessage } from '@/lib/api/chat-service';
import { CHAT_SAFETY_NOTICE } from '@/lib/chat-answer';

jest.mock('@/lib/api/chat-service', () => ({
  sendChatMessage: jest.fn(),
}));

const mockSendChatMessage = sendChatMessage as jest.Mock;

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
});
