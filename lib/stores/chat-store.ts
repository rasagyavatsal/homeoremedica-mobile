import { create } from 'zustand';

import type { ChatMessage } from '@/components/chat/chat-view';
import { sendChatMessage } from '@/lib/api/chat-service';
import { chatAnswerBody } from '@/lib/chat-answer';
import {
  appendExchange,
  createChat,
  deleteChat,
  loadChat,
  renameChat,
  subscribeToChats,
} from '@/lib/services/chat-history';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { ChatMessageRecord, ChatSummary } from '@/types/chat-history';

const HISTORY_TURN_LIMIT = 20;

const HISTORY_ERROR_MESSAGE = 'Your chat history could not be loaded. Please try again.';

function historyErrorMessage(cause: unknown): string {
  const message = (cause as { message?: unknown })?.message;
  return typeof message === 'string' && message ? message : HISTORY_ERROR_MESSAGE;
}

let messageIdCounter = 0;
function createMessageId(): string {
  messageIdCounter += 1;
  return `chat-${Date.now()}-${messageIdCounter}`;
}

/**
 * Chat session state shared by the Chat and History tabs. Ports the web
 * app's chat-client ownership model: the store owns the live thread, the
 * draft, the Firestore chat subscription, and every mutation (send, resume,
 * rename, delete). Screens only read state and call actions, so switching
 * tabs never loses the conversation.
 */
export interface ChatState {
  messages: ChatMessage[];
  chats: ChatSummary[];
  activeChatId: string | null;
  resumingChatId: string | null;
  draft: string;
  isSending: boolean;
  error: string | null;
  historyError: string | null;

  setDraft: (draft: string) => void;
  sendMessage: () => Promise<void>;
  startNewChat: () => void;
  resumeChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, title: string) => Promise<void>;
  bindHistory: (userId: string | null) => void;
}

let historyUnsubscribe: (() => void) | null = null;

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  chats: [],
  activeChatId: null,
  resumingChatId: null,
  draft: '',
  isSending: false,
  error: null,
  historyError: null,

  setDraft: (draft) => set({ draft }),

  /** Saves a completed exchange, creating the chat when the thread is new. */
  sendMessage: async () => {
    const { draft, messages, isSending } = get();
    const text = draft.trim();
    if (!text || isSending) return;

    const user = useAuthStore.getState().user;
    const history = messages
      .slice(-HISTORY_TURN_LIMIT)
      .map(({ role, content }) => ({ role, content }));
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: text,
    };

      set({ messages: [...messages, userMessage], draft: '', error: null, isSending: true });

    try {
      const response = await sendChatMessage({ message: text, history });
      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: chatAnswerBody(response.answer),
        sources: response.sources,
      };
      set((state) => ({ messages: [...state.messages, assistantMessage] }));

      if (user) {
        const { activeChatId } = get();
        try {
          if (activeChatId) {
            await appendExchange(activeChatId, [userMessage, assistantMessage]);
          } else {
            const created = await createChat(user.id, [userMessage, assistantMessage]);
            set({ activeChatId: created.id });
          }
        } catch (cause) {
          console.error('Failed to save chat exchange:', cause);
          set({ historyError: 'Your chat could not be saved to your account.' });
        }
      }
    } catch (cause) {
      set((state) => ({
        messages: state.messages.filter((message) => message.id !== userMessage.id),
        draft: text,
        error:
          typeof (cause as { message?: unknown })?.message === 'string'
            ? (cause as { message: string }).message
            : 'The chat service could not answer right now. Please try again.',
      }));
    } finally {
      set({ isSending: false });
    }
  },

  startNewChat: () =>
    set({
      messages: [],
      activeChatId: null,
      error: null,
      historyError: null,
      draft: '',
    }),

  resumeChat: async (chatId) => {
    if (chatId === get().activeChatId) return;

    set({ resumingChatId: chatId, historyError: null });
    try {
      const chat = await loadChat(chatId);
      if (!chat) {
        set({ historyError: 'That chat no longer exists.' });
        return;
      }
      set({
        messages: chat.messages,
        activeChatId: chatId,
        draft: '',
        error: null,
      });
    } catch (cause) {
      set({ historyError: historyErrorMessage(cause) });
    } finally {
      set({ resumingChatId: null });
    }
  },

  deleteChat: async (chatId) => {
    set({ historyError: null });
    try {
      await deleteChat(chatId);
      if (chatId === get().activeChatId) {
        set({ messages: [], activeChatId: null });
      }
    } catch (cause) {
      console.error('Failed to delete chat:', cause);
      set({ historyError: 'That chat could not be deleted. Please try again.' });
    }
  },

  renameChat: async (chatId, title) => {
    set({ historyError: null });
    try {
      await renameChat(chatId, title);
    } catch (cause) {
      console.error('Failed to rename chat:', cause);
      set({ historyError: 'That chat could not be renamed. Please try again.' });
    }
  },

  /** Rebinds the live chat list to a signed-in user, or clears it on sign-out. */
  bindHistory: (userId) => {
    historyUnsubscribe?.();
    historyUnsubscribe = null;
    if (!userId) {
      set({ chats: [], historyError: null });
      return;
    }
    set({ historyError: null });
    historyUnsubscribe = subscribeToChats(
      userId,
      (chats) => set({ chats }),
      () => set({ historyError: HISTORY_ERROR_MESSAGE }),
    );
  },
}));

// Follow the auth store: subscribe to history on sign-in, clear on sign-out.
// The persisted auth store may hydrate after module load, so the initial bind
// runs now and the subscription covers every later change.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id === previous.user?.id) return;
  useChatStore.getState().bindHistory(state.user?.id ?? null);
});
useChatStore.getState().bindHistory(useAuthStore.getState().user?.id ?? null);
