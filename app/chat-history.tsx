import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Surface } from '@/components/ui/Surface';
import { Body, Display, Eyebrow } from '@/components/ui/Type';
import { radius, sizes, space, useTheme, withAlpha } from '@/constants/theme';
import { deleteChat, formatChatDate, subscribeToChats, type ChatSummary } from '@/lib/chat-history';
import { withHaptic } from '@/lib/haptics';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useChatHistoryStore } from '@/lib/stores/chat-history-store';

const HISTORY_ERROR_MESSAGE = 'Your chat history could not be loaded. Please try again.';

export default function ChatHistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const { activeChatId, resumeChat, clearActiveChat } = useChatHistoryStore();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }
    setLoadError(null);
    const unsubscribe = subscribeToChats(
      user.id,
      (nextChats) => setChats(nextChats),
      () => setLoadError(HISTORY_ERROR_MESSAGE),
    );
    return unsubscribe;
  }, [user]);

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: space.page }}>
        <Surface radius="lg" style={{ alignItems: 'center', padding: space.xxl }}>
          <Display size="sm" style={{ textAlign: 'center' }}>
            Sign in to see your chats
          </Display>
          <Body
            size="sm"
            tone="onSurfaceVariant"
            style={{ marginTop: space.md, textAlign: 'center' }}
          >
            Your chat history is saved to your account and available on every device.
          </Body>
          <Button
            title="Sign in"
            style={{ marginTop: space.xl, alignSelf: 'stretch' }}
            onPress={() => router.push('/auth/login')}
          />
        </Surface>
      </View>
    );
  }

  const handleNewChat = () => {
    clearActiveChat();
    router.back();
  };

  const handleSelect = (chatId: string) => {
    resumeChat(chatId);
    router.back();
  };

  const confirmDelete = (chat: ChatSummary) => {
    Alert.alert('Delete chat', `Delete “${chat.title}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteChat(chat.id)
            .then(() => {
              if (chat.id === activeChatId) {
                clearActiveChat();
              }
            })
            .catch(() => setLoadError('That chat could not be deleted. Please try again.'));
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {loadError ? (
        <View style={{ paddingHorizontal: space.page, paddingTop: space.md }}>
          <Callout variant="destructive">{loadError}</Callout>
        </View>
      ) : null}

      <FlatList
        data={chats}
        keyExtractor={(chat) => chat.id}
        contentContainerStyle={{
          padding: space.page,
          gap: space.sm,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          <Button
            title="New chat"
            variant="outline"
            icon={<Ionicons name="add" size={18} color={colors.primary} />}
            onPress={handleNewChat}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: space.xxxl }}>
            <Body tone="onSurfaceVariant" style={{ textAlign: 'center' }}>
              No chats yet.
            </Body>
            <Body
              size="sm"
              tone="onSurfaceVariant"
              style={{ marginTop: space.xs, textAlign: 'center' }}
            >
              Ask the materia medica a question and it will appear here.
            </Body>
          </View>
        }
        renderItem={({ item }) => {
          const isActive = item.id === activeChatId;
          return (
            <Pressable
              onPress={withHaptic(() => handleSelect(item.id))}
              accessibilityRole="button"
              accessibilityLabel={`Resume chat ${item.title}`}
              accessibilityState={{ selected: isActive }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                minHeight: sizes.touch + 12,
                paddingHorizontal: space.lg,
                paddingVertical: space.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: isActive ? colors.primary : withAlpha(colors.border, 0.32),
                backgroundColor: pressed
                  ? colors.accent
                  : isActive
                    ? colors.accent
                    : colors.card,
              })}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={20}
                color={isActive ? colors.primary : colors.onSurfaceVariant}
              />
              <View style={{ flex: 1 }}>
                <Body numberOfLines={1} style={{ fontWeight: isActive ? '500' : '400' }}>
                  {item.title}
                </Body>
                <Eyebrow tone="onSurfaceVariant" style={{ marginTop: 2 }}>
                  {formatChatDate(item.updatedAt)}
                  {isActive ? ' · Open' : ''}
                </Eyebrow>
              </View>
              <Pressable
                onPress={withHaptic(() => confirmDelete(item))}
                accessibilityRole="button"
                accessibilityLabel={`Delete chat ${item.title}`}
                hitSlop={8}
                style={({ pressed }) => ({
                  width: sizes.iconButton,
                  height: sizes.iconButton,
                  borderRadius: radius.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? colors.secondary : 'transparent',
                })}
              >
                <Ionicons name="trash-outline" size={18} color={colors.destructive} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
