import { useHeaderHeight } from '@react-navigation/elements';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ChatComposer,
  ChatEmptyState,
  ChatError,
  ChatThread,
  type ChatMessage,
} from '@/components/chat/chat-view';
import { useTheme } from '@/constants/theme';
import { sendChatMessage } from '@/lib/api/chat-service';
import { chatAnswerBody } from '@/lib/chat-answer';
import { appendExchange, createChat, loadChat } from '@/lib/chat-history';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useChatHistoryStore } from '@/lib/stores/chat-history-store';

const HISTORY_TURN_LIMIT = 20;

let messageIdCounter = 0;
function createMessageId(): string {
  messageIdCounter += 1;
  return `chat-${Date.now()}-${messageIdCounter}`;
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const user = useAuthStore((state) => state.user);
  const { activeChatId, resumeNonce, setActiveChatId, clearActiveChat } =
    useChatHistoryStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const hasMessages = messages.length > 0;

  // Reacts to resume/clear requests issued from the history screen.
  useEffect(() => {
    if (resumeNonce === 0) return;

    if (!activeChatId) {
      setMessages([]);
      setError(null);
      setHistoryError(null);
      setDraft('');
      return;
    }

    let cancelled = false;
    loadChat(activeChatId)
      .then((chat) => {
        if (cancelled) return;
        if (!chat) {
          setHistoryError('That chat no longer exists.');
          return;
        }
        setMessages(chat.messages);
        setError(null);
        setHistoryError(null);
        setDraft('');
      })
      .catch(() => {
        if (!cancelled) {
          setHistoryError('That chat could not be loaded. Please try again.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resumeNonce, activeChatId]);

  /** Saves a completed exchange, creating the chat when the thread is new. */
  const persistExchange = async (exchange: ChatMessage[]) => {
    if (!user) return;
    try {
      if (activeChatId) {
        await appendExchange(activeChatId, exchange);
      } else {
        const created = await createChat(user.id, exchange);
        setActiveChatId(created.id);
      }
    } catch (cause) {
      console.warn('Failed to save chat exchange:', cause);
      setHistoryError('Your chat could not be saved to your account.');
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || isSending) return;

    const history = messages
      .slice(-HISTORY_TURN_LIMIT)
      .map(({ role, content }) => ({ role, content }));
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setError(null);
    setIsSending(true);

    try {
      const response = await sendChatMessage({ message: text, history });
      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: chatAnswerBody(response.answer),
        sources: response.sources,
      };
      setMessages((current) => [...current, assistantMessage]);
      await persistExchange([userMessage, assistantMessage]);
    } catch (cause) {
      setMessages((current) =>
        current.filter((message) => message.id !== userMessage.id),
      );
      setDraft(text);
      setError(
        typeof (cause as { message?: unknown })?.message === 'string'
          ? (cause as { message: string }).message
          : 'The chat service could not answer right now. Please try again.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const startNewChat = () => {
    clearActiveChat();
    setMessages([]);
    setError(null);
    setHistoryError(null);
    setDraft('');
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={[]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        {hasMessages ? (
          <ChatThread
            messages={messages}
            isSending={isSending}
            onNewChat={startNewChat}
          />
        ) : (
          <ChatEmptyState />
        )}

        {error ? <ChatError error={error} /> : null}
        {historyError ? <ChatError error={historyError} /> : null}

        <ChatComposer
          draft={draft}
          isSending={isSending}
          onDraftChange={setDraft}
          onSubmit={sendMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
