import { create } from 'zustand';

/**
 * Coordinates chat resume/clear requests between the history screen and
 * the chat screen. The history screen asks for a resume and navigates
 * back; the chat screen observes the nonce and loads the requested chat.
 * A separate nonce lets the same chat be resumed twice in a row.
 */
export interface ChatHistoryState {
  /** Chat the user is currently in (null while on a fresh thread). */
  activeChatId: string | null;
  /** Incremented on every resume/clear request so screens can react. */
  resumeNonce: number;
  /** Adopts a chat id without asking the chat screen to reload. */
  setActiveChatId: (chatId: string | null) => void;
  /** Requests the chat screen to load a stored chat. */
  resumeChat: (chatId: string) => void;
  /** Requests the chat screen to start a fresh thread. */
  clearActiveChat: () => void;
}

export const useChatHistoryStore = create<ChatHistoryState>()((set) => ({
  activeChatId: null,
  resumeNonce: 0,
  setActiveChatId: (chatId) => set({ activeChatId: chatId }),
  resumeChat: (chatId) =>
    set((state) => ({ activeChatId: chatId, resumeNonce: state.resumeNonce + 1 })),
  clearActiveChat: () =>
    set((state) => ({ activeChatId: null, resumeNonce: state.resumeNonce + 1 })),
}));
