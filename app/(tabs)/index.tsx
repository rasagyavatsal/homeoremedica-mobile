import { useHeaderHeight } from '@react-navigation/elements';
import React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ChatComposer,
  ChatEmptyState,
  ChatError,
  ChatThread,
} from '@/components/chat/chat-view';
import { useTheme } from '@/constants/theme';
import { useChatStore } from '@/lib/stores/chat-store';

export default function ChatScreen() {
  const { colors } = useTheme();
  const headerHeight = useHeaderHeight();

  const messages = useChatStore((state) => state.messages);
  const isSending = useChatStore((state) => state.isSending);
  const draft = useChatStore((state) => state.draft);
  const error = useChatStore((state) => state.error);
  const historyError = useChatStore((state) => state.historyError);
  const setDraft = useChatStore((state) => state.setDraft);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const hasMessages = messages.length > 0;

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
          onSubmit={() => void sendMessage()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
