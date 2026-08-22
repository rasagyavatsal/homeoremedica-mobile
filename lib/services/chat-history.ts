/**
 * Chat history service — owns every client-side read/write to the Firestore
 * `chats` collection. The UI never touches Firestore types, queries, or
 * error handling directly: it calls this module and receives plain
 * ChatSummary/ChatRecord values (or subscription callbacks).
 *
 * Persistence strategy (kept in sync with apps/web/lib/services/chat-history.ts):
 * - One document per chat, keyed by auto id, with the full message array
 *   inlined. The thread history cap (20 turns) keeps documents well under
 *   Firestore's 1 MiB limit and a resume is a single getDoc.
 * - New exchanges are appended with arrayUnion so a chat can only grow;
 *   every append refreshes updatedAt, which drives the sidebar ordering.
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
import type {
  ChatMessageRecord,
  ChatRecord,
  ChatSummary,
} from '@/types/chat-history';

export const CHATS_COLLECTION = 'chats';
export const CHAT_TITLE_MAX_LENGTH = 60;

const DAY_MS = 86_400_000;

/** Derives a short sidebar title from the first user message of a chat. */
export function titleFromMessage(content: string): string {
  const firstLine = content.trim().split(/\r?\n/, 1)[0] ?? '';
  const clipped =
    firstLine.length > CHAT_TITLE_MAX_LENGTH
      ? `${firstLine.slice(0, CHAT_TITLE_MAX_LENGTH - 1)}…`
      : firstLine;
  return clipped || 'New chat';
}

/** Renders a compact timestamp for the sidebar ("2:41 PM", "Yesterday", "Mar 4"). */
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

/** Renames a chat with an already-trimmed, validated title. */
export async function renameChat(chatId: string, title: string): Promise<void> {
  await updateDoc(doc(db, CHATS_COLLECTION, chatId), { title });
}

/** Permanently deletes a chat. */
export async function deleteChat(chatId: string): Promise<void> {
  await deleteDoc(doc(db, CHATS_COLLECTION, chatId));
}

/**
 * Live-subscribes to the user's chats, newest first. Requires the
 * composite index (userId ASC, updatedAt DESC) deployed via
 * firestore.indexes.json. The subscription reports failures through
 * onError and keeps the previous list untouched.
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
