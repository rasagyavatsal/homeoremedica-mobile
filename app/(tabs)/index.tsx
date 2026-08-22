import { useHeaderHeight } from '@react-navigation/elements';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ChatComposer,
  ChatEmptyState,
  ChatError,
  ChatThread,
  type ChatMessage,
} from '@/components/chat/chat-view';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { radius, sizes, space, useTheme, withAlpha } from '@/constants/theme';
import { sendChatMessage } from '@/lib/api/chat-service';
import { chatAnswerBody } from '@/lib/chat-answer';
import { withHaptic } from '@/lib/haptics';
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

export default function ChatScreen() {
  const { colors, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [resumingChatId, setResumingChatId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }
    setHistoryError(null);
    const unsubscribe = subscribeToChats(
      user.id,
      (nextChats) => setChats(nextChats),
      () => setHistoryError(HISTORY_ERROR_MESSAGE),
    );
    return unsubscribe;
  }, [user]);

  /** Saves a completed exchange, creating the chat when the thread is new. */
  const persistExchange = async (exchange: ChatMessageRecord[]) => {
    if (!user) return;
    try {
      if (activeChatId) {
        await appendExchange(activeChatId, exchange);
      } else {
        const created = await createChat(user.id, exchange);
        setActiveChatId(created.id);
      }
    } catch (cause) {
      console.error('Failed to save chat exchange:', cause);
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
    setMessages([]);
    setActiveChatId(null);
    setError(null);
    setHistoryError(null);
    setDraft('');
    setIsSidebarOpen(false);
  };

  const resumeChat = async (chatId: string) => {
    if (chatId === activeChatId) {
      setIsSidebarOpen(false);
      return;
    }

    setResumingChatId(chatId);
    setHistoryError(null);
    try {
      const chat = await loadChat(chatId);
      if (!chat) {
        setHistoryError('That chat no longer exists.');
        return;
      }
      setMessages(chat.messages);
      setActiveChatId(chatId);
      setDraft('');
      setError(null);
    } catch (cause) {
      setHistoryError(historyErrorMessage(cause));
    } finally {
      setResumingChatId(null);
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    setHistoryError(null);
    try {
      await deleteChat(chatId);
      if (chatId === activeChatId) {
        setMessages([]);
        setActiveChatId(null);
      }
    } catch (cause) {
      console.error('Failed to delete chat:', cause);
      setHistoryError('That chat could not be deleted. Please try again.');
    }
  };

  const handleRenameChat = async (chatId: string, title: string) => {
    setHistoryError(null);
    try {
      await renameChat(chatId, title);
    } catch (cause) {
      console.error('Failed to rename chat:', cause);
      setHistoryError('That chat could not be renamed. Please try again.');
    }
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
        <View
          style={{
            flexShrink: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: space.page,
            paddingTop: space.sm,
          }}
        >
          <Pressable
            onPress={withHaptic(() => setIsSidebarOpen(true))}
            accessibilityRole="button"
            accessibilityLabel="Open chat history"
            hitSlop={8}
            style={({ pressed }) => ({
              width: sizes.iconButton,
              height: sizes.iconButton,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
              backgroundColor: pressed ? colors.accent : 'transparent',
            })}
          >
            <Ionicons name="menu" size={20} color={colors.foreground} />
          </Pressable>
          <Button
            title="New chat"
            variant="ghost"
            onPress={startNewChat}
            icon={
              <Ionicons name="refresh" size={16} color={colors.onSurfaceVariant} />
            }
          />
        </View>

        {hasMessages ? (
          <ChatThread messages={messages} isSending={isSending} />
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

      <Sheet
        variant="side"
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      >
        <ChatSidebar
          user={user}
          chats={chats}
          activeChatId={activeChatId}
          isResuming={resumingChatId !== null}
          onNewChat={startNewChat}
          onSelectChat={(chatId) => void resumeChat(chatId)}
          onDeleteChat={(chatId) => void handleDeleteChat(chatId)}
          onRenameChat={(chatId, title) => void handleRenameChat(chatId, title)}
          onNavigate={() => setIsSidebarOpen(false)}
        />
      </Sheet>
    </SafeAreaView>
  );
}
