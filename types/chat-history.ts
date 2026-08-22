import type { Timestamp } from 'firebase/firestore';

import type { ChatSource } from './chat';

/**
 * A single persisted message inside a chat record. Mirrors ChatMessage from
 * components/chat/chat-view.tsx, so a stored chat can be restored without
 * translation. Kept in sync with apps/web/lib/types/chat-history.ts.
 */
export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
}

/** Document shape of the Firestore `chats` collection. */
export interface ChatRecord {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  messages: ChatMessageRecord[];
}

/** Lightweight projection used to render the history sidebar. */
export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: Timestamp | null;
}
