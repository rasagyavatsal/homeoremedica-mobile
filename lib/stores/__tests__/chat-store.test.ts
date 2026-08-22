jest.mock('@/lib/api/chat-service', () => ({
  sendChatMessage: jest.fn(),
}));

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

jest.mock('@/lib/stores/auth-store', () => {
  const mock = jest.fn(() => ({ user: null })) as jest.Mock & {
    getState: () => { user: unknown };
    subscribe: jest.Mock;
  };
  mock.getState = () => mock();
  mock.subscribe = jest.fn();
  return { useAuthStore: mock };
});

import { sendChatMessage } from '@/lib/api/chat-service';
import {
  appendExchange,
  createChat,
  deleteChat,
  loadChat,
  renameChat,
  subscribeToChats,
} from '@/lib/services/chat-history';
import { CHAT_SAFETY_NOTICE } from '@/lib/chat-answer';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useChatStore } from '../chat-store';

const mockUseAuthStore = useAuthStore as unknown as jest.Mock & {
  getState: () => { user: unknown };
  subscribe: jest.Mock;
};

const mockSendChatMessage = sendChatMessage as jest.Mock;
const mockCreateChat = createChat as jest.Mock;
const mockAppendExchange = appendExchange as jest.Mock;
const mockLoadChat = loadChat as jest.Mock;
const mockRenameChat = renameChat as jest.Mock;
const mockDeleteChat = deleteChat as jest.Mock;
const mockSubscribeToChats = subscribeToChats as jest.Mock;

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

function setSignedInUser() {
  mockUseAuthStore.mockReturnValue({
    user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
  });
  useChatStore.getState().bindHistory('user-1');
}

function resetStore() {
  useChatStore.setState({
    messages: [],
    chats: [],
    activeChatId: null,
    resumingChatId: null,
    draft: '',
    isSending: false,
    error: null,
    historyError: null,
  });
}

describe('useChatStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChatSubscribers.length = 0;
    mockUseAuthStore.mockReturnValue({ user: null });
    resetStore();
  });

  describe('sendMessage', () => {
    it('sends the question and stores the answer without the repeated notice', async () => {
      mockSendChatMessage.mockResolvedValue(makeResponse());
      useChatStore.getState().setDraft('How is Nux vomica described?');

      await useChatStore.getState().sendMessage();

      const { messages, draft, isSending } = useChatStore.getState();
      expect(mockSendChatMessage).toHaveBeenCalledWith({
        message: 'How is Nux vomica described?',
        history: [],
      });
      expect(messages.map(({ role, content }) => ({ role, content }))).toEqual([
        { role: 'user', content: 'How is Nux vomica described?' },
        { role: 'assistant', content: ANSWER_BODY },
      ]);
      expect(draft).toBe('');
      expect(isSending).toBe(false);
    });

    it('sends prior turns as history on the next question', async () => {
      mockSendChatMessage.mockResolvedValue(makeResponse());
      useChatStore.getState().setDraft('First question');
      await useChatStore.getState().sendMessage();

      useChatStore.getState().setDraft('Tell me more');
      await useChatStore.getState().sendMessage();

      expect(mockSendChatMessage).toHaveBeenLastCalledWith({
        message: 'Tell me more',
        history: [
          { role: 'user', content: 'First question' },
          { role: 'assistant', content: ANSWER_BODY },
        ],
      });
    });

    it('restores the draft and surfaces the error when the request fails', async () => {
      mockSendChatMessage.mockRejectedValue({
        code: 'UPSTREAM_UNAVAILABLE',
        message: 'The chat service could not answer right now. Please try again.',
      });
      useChatStore.getState().setDraft('How is Nux vomica described?');

      await useChatStore.getState().sendMessage();

      const { messages, draft, error } = useChatStore.getState();
      expect(messages).toEqual([]);
      expect(draft).toBe('How is Nux vomica described?');
      expect(error).toBe('The chat service could not answer right now. Please try again.');
    });

    it('does not persist chats for signed-out users', async () => {
      mockSendChatMessage.mockResolvedValue(makeResponse());
      useChatStore.getState().setDraft('How is Nux vomica described?');

      await useChatStore.getState().sendMessage();

      expect(mockCreateChat).not.toHaveBeenCalled();
      expect(mockAppendExchange).not.toHaveBeenCalled();
    });

    it('creates a chat on the first exchange when signed in', async () => {
      setSignedInUser();
      mockSendChatMessage.mockResolvedValue(makeResponse());
      mockCreateChat.mockResolvedValue({
        id: 'chat-1',
        title: 'How is Nux',
        updatedAt: null,
      });
      useChatStore.getState().setDraft('How is Nux vomica described?');

      await useChatStore.getState().sendMessage();

      expect(mockCreateChat).toHaveBeenCalledWith('user-1', [
        expect.objectContaining({ role: 'user', content: 'How is Nux vomica described?' }),
        expect.objectContaining({ role: 'assistant', content: ANSWER_BODY }),
      ]);
      expect(useChatStore.getState().activeChatId).toBe('chat-1');
    });

    it('appends later exchanges to the active chat', async () => {
      setSignedInUser();
      mockSendChatMessage.mockResolvedValue(makeResponse());
      mockCreateChat.mockResolvedValue({ id: 'chat-1', title: 'First question', updatedAt: null });
      useChatStore.getState().setDraft('First question');
      await useChatStore.getState().sendMessage();

      useChatStore.getState().setDraft('Tell me more');
      await useChatStore.getState().sendMessage();

      expect(mockAppendExchange).toHaveBeenCalledWith('chat-1', [
        expect.objectContaining({ role: 'user', content: 'Tell me more' }),
        expect.objectContaining({ role: 'assistant', content: ANSWER_BODY }),
      ]);
    });

    it('reports a history error when persisting fails', async () => {
      setSignedInUser();
      mockSendChatMessage.mockResolvedValue(makeResponse());
      mockCreateChat.mockRejectedValue(new Error('permission-denied'));
      useChatStore.getState().setDraft('How is Nux vomica described?');

      await useChatStore.getState().sendMessage();

      expect(useChatStore.getState().historyError).toBe(
        'Your chat could not be saved to your account.'
      );
    });
  });

  describe('resumeChat', () => {
    it('loads a chat into the thread', async () => {
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

      await useChatStore.getState().resumeChat('chat-9');

      expect(mockLoadChat).toHaveBeenCalledWith('chat-9');
      expect(useChatStore.getState().messages.map(({ content }) => content)).toEqual([
        'Old question',
        'Old answer',
      ]);
      expect(useChatStore.getState().activeChatId).toBe('chat-9');
      expect(useChatStore.getState().resumingChatId).toBeNull();
    });

    it('is a no-op for the already active chat', async () => {
      useChatStore.setState({ activeChatId: 'chat-9' });

      await useChatStore.getState().resumeChat('chat-9');

      expect(mockLoadChat).not.toHaveBeenCalled();
    });

    it('shows a history error when the chat no longer exists', async () => {
      mockLoadChat.mockResolvedValue(null);

      await useChatStore.getState().resumeChat('chat-9');

      expect(useChatStore.getState().historyError).toBe('That chat no longer exists.');
    });

    it('passes load failures through as history errors', async () => {
      mockLoadChat.mockRejectedValue(new Error('permission-denied'));

      await useChatStore.getState().resumeChat('chat-9');

      expect(useChatStore.getState().historyError).toBe('permission-denied');
    });
  });

  describe('deleteChat', () => {
    it('clears the thread when the active chat is deleted', async () => {
      mockDeleteChat.mockResolvedValue(undefined);
      useChatStore.setState({
        activeChatId: 'chat-1',
        messages: [{ id: 'm1', role: 'user', content: 'Old question' }],
      });

      await useChatStore.getState().deleteChat('chat-1');

      expect(useChatStore.getState().messages).toEqual([]);
      expect(useChatStore.getState().activeChatId).toBeNull();
    });

    it('keeps the thread when another chat is deleted', async () => {
      mockDeleteChat.mockResolvedValue(undefined);
      useChatStore.setState({
        activeChatId: 'chat-1',
        messages: [{ id: 'm1', role: 'user', content: 'Old question' }],
      });

      await useChatStore.getState().deleteChat('chat-2');

      expect(useChatStore.getState().messages).toHaveLength(1);
      expect(useChatStore.getState().activeChatId).toBe('chat-1');
    });

    it('reports a history error when deletion fails', async () => {
      mockDeleteChat.mockRejectedValue(new Error('permission-denied'));

      await useChatStore.getState().deleteChat('chat-1');

      expect(useChatStore.getState().historyError).toBe(
        'That chat could not be deleted. Please try again.'
      );
    });
  });

  describe('renameChat', () => {
    it('renames a chat', async () => {
      mockRenameChat.mockResolvedValue(undefined);

      await useChatStore.getState().renameChat('chat-1', 'New title');

      expect(mockRenameChat).toHaveBeenCalledWith('chat-1', 'New title');
    });

    it('reports a history error when renaming fails', async () => {
      mockRenameChat.mockRejectedValue(new Error('permission-denied'));

      await useChatStore.getState().renameChat('chat-1', 'New title');

      expect(useChatStore.getState().historyError).toBe(
        'That chat could not be renamed. Please try again.'
      );
    });
  });

  describe('startNewChat', () => {
    it('clears the thread, errors, and draft', () => {
      useChatStore.setState({
        messages: [{ id: 'm1', role: 'user', content: 'Old question' }],
        activeChatId: 'chat-1',
        draft: 'unfinished',
        error: 'some error',
        historyError: 'some history error',
      });

      useChatStore.getState().startNewChat();

      const { messages, activeChatId, draft, error, historyError } = useChatStore.getState();
      expect(messages).toEqual([]);
      expect(activeChatId).toBeNull();
      expect(draft).toBe('');
      expect(error).toBeNull();
      expect(historyError).toBeNull();
    });
  });

  describe('bindHistory', () => {
    it('subscribes to the user chats and forwards them', () => {
      useChatStore.getState().bindHistory('user-1');

      expect(mockSubscribeToChats).toHaveBeenCalledWith(
        'user-1',
        expect.any(Function),
        expect.any(Function)
      );

      mockChatSubscribers[0].onNext([{ id: 'chat-1', title: 'A chat', updatedAt: null }]);

      expect(useChatStore.getState().chats).toEqual([
        { id: 'chat-1', title: 'A chat', updatedAt: null },
      ]);
    });

    it('reports subscription failures as history errors', () => {
      useChatStore.getState().bindHistory('user-1');

      mockChatSubscribers[0].onError(new Error('permission-denied'));

      expect(useChatStore.getState().historyError).toBe(
        'Your chat history could not be loaded. Please try again.'
      );
    });

    it('replaces the previous subscription on re-bind', () => {
      const firstUnsubscribe = jest.fn();
      mockSubscribeToChats.mockReturnValueOnce(firstUnsubscribe);

      useChatStore.getState().bindHistory('user-1');
      useChatStore.getState().bindHistory('user-2');

      expect(firstUnsubscribe).toHaveBeenCalled();
      expect(mockSubscribeToChats).toHaveBeenCalledTimes(2);
      expect(mockSubscribeToChats).toHaveBeenLastCalledWith(
        'user-2',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('clears the list when the user signs out', () => {
      useChatStore.setState({ chats: [{ id: 'chat-1', title: 'A chat', updatedAt: null }] });
      useChatStore.getState().bindHistory('user-1');
      const unsubscribe = mockSubscribeToChats.mock.results[0].value;
      useChatStore.setState({ historyError: 'stale error' });

      useChatStore.getState().bindHistory(null);

      expect(unsubscribe).toHaveBeenCalled();
      expect(useChatStore.getState().chats).toEqual([]);
      expect(useChatStore.getState().historyError).toBeNull();
    });
  });
});
