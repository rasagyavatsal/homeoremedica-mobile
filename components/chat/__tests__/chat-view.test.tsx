import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import {
  ChatComposer,
  ChatEmptyState,
  ChatError,
  ChatThread,
  type ChatMessage,
} from '../chat-view';
import { CHAT_SAFETY_NOTICE } from '@/lib/chat-answer';

jest.mock('@/lib/haptics', () => ({
  withHaptic: (handler: () => void) => handler,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const SOURCE = {
  id: '2026-08-15.v1/kent-lectures/chk_1',
  bookId: 'kent-lectures',
  bookTitle: "Kent's Lectures on Homoeopathic Materia Medica",
  author: 'James Tyler Kent',
  remedyName: 'NUX VOMICA',
  sectionTitle: 'Mind',
  passageIndexes: [0],
  text: 'Irritable.\n\nAlways chilly.',
};

const ASSISTANT_MESSAGE: ChatMessage = {
  id: 'a1',
  role: 'assistant',
  content: 'Nux vomica is irritable and chilly [1].',
  sources: [SOURCE],
};

describe('ChatEmptyState', () => {
  it('invites the first question', () => {
    const { getByText } = render(<ChatEmptyState />);
    expect(getByText('Ask the materia medica')).toBeTruthy();
    expect(
      getByText('Answers cite passages from Clarke, Boericke, Kent, and Allen.')
    ).toBeTruthy();
  });
});

describe('ChatComposer', () => {
  it('shows the persistent safety notice under the composer', () => {
    const { getAllByText, getByPlaceholderText } = render(
      <ChatComposer
        draft=""
        isSending={false}
        onDraftChange={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(getByPlaceholderText('Ask about a remedy or symptom…')).toBeTruthy();
    expect(getAllByText(CHAT_SAFETY_NOTICE)).toHaveLength(1);
  });

  it('disables send while the draft is empty and enables it with text', () => {
    const { getByLabelText, rerender } = render(
      <ChatComposer
        draft=""
        isSending={false}
        onDraftChange={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(getByLabelText('Send message').props.accessibilityState.disabled).toBe(
      true
    );

    rerender(
      <ChatComposer
        draft="A draft"
        isSending={false}
        onDraftChange={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(getByLabelText('Send message').props.accessibilityState.disabled).toBe(
      false
    );
  });

  it('submits through the send button', () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = render(
      <ChatComposer
        draft="A draft"
        isSending={false}
        onDraftChange={jest.fn()}
        onSubmit={onSubmit}
      />
    );

    fireEvent.press(getByLabelText('Send message'));
    expect(onSubmit).toHaveBeenCalled();
  });
});

describe('ChatThread', () => {
  it('renders user and assistant messages', () => {
    const { getByText } = render(
      <ChatThread
        messages={[
          { id: 'u1', role: 'user', content: 'How is Nux vomica described?' },
          ASSISTANT_MESSAGE,
        ]}
        isSending={false}
      />
    );

    expect(getByText('How is Nux vomica described?')).toBeTruthy();
    expect(getByText('Nux vomica is irritable and chilly [1].')).toBeTruthy();
  });

  it('reveals cited passages when the sources toggle opens', () => {
    const { getByText, queryByText } = render(
      <ChatThread
        messages={[ASSISTANT_MESSAGE]}
        isSending={false}
      />
    );

    expect(getByText('1 source')).toBeTruthy();
    expect(queryByText(/Irritable\./)).toBeNull();

    fireEvent.press(getByText('1 source'));

    expect(getByText('Nux Vomica · Mind')).toBeTruthy();
    expect(getByText('Kent lectures')).toBeTruthy();
    expect(getByText('Irritable.\n\nAlways chilly.')).toBeTruthy();
  });

  it('shows a waiting indicator while an answer is on its way', () => {
    const { getByText } = render(
      <ChatThread
        messages={[{ id: 'u1', role: 'user', content: 'Hello?' }]}
        isSending
      />
    );

    expect(getByText('Waiting for the answer…')).toBeTruthy();
  });
});

describe('ChatError', () => {
  it('surfaces the failure message', () => {
    const { getByText } = render(
      <ChatError error="The chat service could not answer right now. Please try again." />
    );
    expect(
      getByText('The chat service could not answer right now. Please try again.')
    ).toBeTruthy();
  });
});
