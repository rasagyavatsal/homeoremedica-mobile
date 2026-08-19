/**
 * Chat history service — owns every read/write to the Firestore `chats`
 * collection for the native app. Screens never touch Firestore types,
 * queries, or error handling directly: they call this module and receive
 * plain ChatSummary/ChatRecord values (or subscription callbacks).
 *
 * Mirrors apps/web/lib/services/chat-history.ts; the two implementations
 * must stay in sync because they share the same collection and rules.
 *
 * Persistence strategy:
 * - One document per chat, keyed by auto id, with the full message array
 *   inlined. The thread history cap (20 turns) keeps documents well under
 *   Firestore's 1 MiB limit and a resume is a single getDoc.
 * - New exchanges are appended with arrayUnion so a chat can only grow;
 *   every append refreshes updatedAt, which drives the list ordering.
 */

import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { ChatSource } from '@/types/chat';

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

/** Lightweight projection used to render the history list. */
export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: Timestamp | null;
}

export const CHATS_COLLECTION = 'chats';
export const CHAT_TITLE_MAX_LENGTH = 60;

const DAY_MS = 86_400_000;

/** Derives a short list title from the first user message of a chat. */
export function titleFromMessage(content: string): string {
  const firstLine = content.trim().split(/\r?\n/, 1)[0] ?? '';
  const clipped =
    firstLine.length > CHAT_TITLE_MAX_LENGTH
      ? `${firstLine.slice(0, CHAT_TITLE_MAX_LENGTH - 1)}…`
      : firstLine;
  return clipped || 'New chat';
}

/** Renders a compact timestamp for the list ("2:41 PM", "Yesterday", "Mar 4"). */
export function formatChatDate(updatedAt: Timestamp | null): string {
  if (!updatedAt) return '';

  const date = updatedAt.toDate();
  const now = new Date();
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);

  if (dayDiff <= 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (dayDiff === 1) return 'Yesterday';
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toSummary(id: string, data: { title?: unknown; updatedAt?: unknown }): ChatSummary {
  return {
    id,
    title: typeof data.title === 'string' && data.title ? data.title : 'New chat',
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
  };
}

/** Creates a new chat for the user and returns its summary. */
export async function createChat(
  userId: string,
  messages: ChatMessageRecord[],
): Promise<ChatSummary> {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const title = titleFromMessage(firstUserMessage?.content ?? '');
  const ref = await addDoc(collection(db, CHATS_COLLECTION), {
    userId,
    title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messages,
  });
  return { id: ref.id, title, updatedAt: null };
}

/** Appends a user/assistant exchange to an existing chat. */
export async function appendExchange(
  chatId: string,
  messages: ChatMessageRecord[],
): Promise<void> {
  await updateDoc(doc(db, CHATS_COLLECTION, chatId), {
    messages: arrayUnion(...messages),
    updatedAt: serverTimestamp(),
  });
}

/** Loads a single chat for resuming; returns null when it no longer exists. */
export async function loadChat(chatId: string): Promise<ChatRecord | null> {
  const snapshot = await getDoc(doc(db, CHATS_COLLECTION, chatId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data() as {
    userId: string;
    title: string;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
    messages?: ChatMessageRecord[];
  };
  return {
    id: snapshot.id,
    userId: data.userId,
    title: data.title,
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    messages: data.messages ?? [],
  };
}

/** Permanently deletes a chat. */
export async function deleteChat(chatId: string): Promise<void> {
  await deleteDoc(doc(db, CHATS_COLLECTION, chatId));
}

/**
 * Live-subscribes to the user's chats, newest first. Requires the
 * composite index (userId ASC, updatedAt DESC) deployed via the web
 * repo's firestore.indexes.json. The subscription reports failures
 * through onError and keeps the previous list untouched.
 */
export function subscribeToChats(
  userId: string,
  onNext: (chats: ChatSummary[]) => void,
  onError?: (cause: unknown) => void,
): () => void {
  const chatsQuery = query(
    collection(db, CHATS_COLLECTION),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
  );

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      onNext(snapshot.docs.map((docSnapshot) => toSummary(docSnapshot.id, docSnapshot.data())));
    },
    (cause) => {
      console.warn('Chat history subscription failed:', cause);
      onError?.(cause);
    },
  );
}
