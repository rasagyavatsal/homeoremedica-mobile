import { useHeaderHeight } from '@react-navigation/elements';
import React, { useState } from 'react';
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

const HISTORY_TURN_LIMIT = 20;

let messageIdCounter = 0;
function createMessageId(): string {
  messageIdCounter += 1;
  return `chat-${Date.now()}-${messageIdCounter}`;
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMessages = messages.length > 0;

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
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: chatAnswerBody(response.answer),
          sources: response.sources,
        },
      ]);
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
    setMessages([]);
    setError(null);
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
