import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { useChatStore } from '@/lib/stores/chat-store';

jest.mock('@/lib/stores/chat-store', () => ({
  useChatStore: jest.fn(),
}));

const mockUseChatStore = useChatStore as unknown as jest.Mock;

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

function makeStoreState(overrides: Record<string, unknown> = {}) {
  return {
    messages: [],
    isSending: false,
    draft: '',
    error: null,
    historyError: null,
    setDraft: jest.fn(),
    sendMessage: jest.fn(),
    ...overrides,
  };
}

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(makeStoreState())
    );
  });

  it('opens on the web empty state with the composer', () => {
    const screen = render(<ChatScreen />);

    expect(screen.getByText('Ask the materia medica')).toBeTruthy();
    expect(
      screen.getByText('Answers draw only from Clarke, Boericke, Kent, and Allen.')
    ).toBeTruthy();
    expect(
      screen.getByPlaceholderText('Ask about a remedy or symptom…')
    ).toBeTruthy();
  });

  it('renders the thread once messages exist', () => {
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(
        makeStoreState({
          messages: [
            { id: 'u1', role: 'user', content: 'How is Nux vomica described?' },
          ],
        })
      )
    );

    const screen = render(<ChatScreen />);

    expect(screen.getByText('How is Nux vomica described?')).toBeTruthy();
    expect(screen.queryByText('Ask the materia medica')).toBeNull();
  });

  it('surfaces chat and history errors as destructive callouts', () => {
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(
        makeStoreState({
          error: 'The chat service could not answer right now.',
          historyError: 'Your chat history could not be loaded.',
        })
      )
    );

    const screen = render(<ChatScreen />);

    expect(
      screen.getByText('The chat service could not answer right now.')
    ).toBeTruthy();
    expect(
      screen.getByText('Your chat history could not be loaded.')
    ).toBeTruthy();
  });

  it('routes drafts through the store', () => {
    const storeState = makeStoreState();
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(storeState)
    );
    const screen = render(<ChatScreen />);

    fireEvent.changeText(
      screen.getByPlaceholderText('Ask about a remedy or symptom…'),
      'A new question'
    );

    expect(storeState.setDraft).toHaveBeenCalledWith('A new question');
  });

  it('submits through the store', () => {
    const storeState = makeStoreState({ draft: 'Send me' });
    mockUseChatStore.mockImplementation((selector: (state: any) => unknown) =>
      selector(storeState)
    );
    const screen = render(<ChatScreen />);

    fireEvent.press(screen.getByLabelText('Send message'));

    expect(storeState.sendMessage).toHaveBeenCalled();
  });
});
