import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { Body, Eyebrow, Title } from '@/components/ui/Type';
import { radius, sizes, space, useTheme, withAlpha } from '@/constants/theme';
import { withHaptic } from '@/lib/haptics';
import { CHAT_TITLE_MAX_LENGTH, formatChatDate } from '@/lib/services/chat-history';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useChatStore } from '@/lib/stores/chat-store';
import type { ChatSummary } from '@/types/chat-history';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface SheetRowProps {
  label: string;
  icon: IoniconsName;
  destructive?: boolean;
  onPress: () => void;
}

function SheetRow({ label, icon, destructive = false, onPress }: SheetRowProps) {
  const { colors } = useTheme();
  const color = destructive ? colors.destructive : colors.foreground;

  return (
    <Pressable
      onPress={withHaptic(onPress)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: sizes.touch,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.xl,
        paddingVertical: space.md,
        backgroundColor: pressed ? colors.accent : 'transparent',
      })}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Body style={{ flex: 1, fontWeight: '500', color }}>
        {label}
      </Body>
    </Pressable>
  );
}

/**
 * Chat history screen, ported from the web app's chat sidebar list
 * (apps/web/components/chat-sidebar.tsx) minus the brand header and the
 * account footer, which live in the tab header and the Account tab here.
 * Web dropdown menus and dialogs become bottom sheets on native.
 */
export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const isResuming = useChatStore((state) => state.resumingChatId !== null);
  const startNewChat = useChatStore((state) => state.startNewChat);
  const resumeChat = useChatStore((state) => state.resumeChat);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const renameChat = useChatStore((state) => state.renameChat);

  const [optionsChat, setOptionsChat] = useState<ChatSummary | null>(null);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const renameChatSummary = chats.find((chat) => chat.id === renameChatId) ?? null;
  const pendingDeleteChat = chats.find((chat) => chat.id === pendingDeleteId) ?? null;

  /** Mirrors the web sidebar: opening a thread returns to the chat. */
  const openChatTab = () => router.navigate('/');

  const handleNewChat = () => {
    startNewChat();
    openChatTab();
  };

  const handleSelect = (chatId: string) => {
    void resumeChat(chatId);
    openChatTab();
  };

  const handleSaveRename = () => {
    const nextTitle = renameDraft.trim();
    if (!renameChatSummary || !nextTitle || nextTitle === renameChatSummary.title) return;
    void renameChat(renameChatSummary.id, nextTitle);
    setRenameChatId(null);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={[]}
    >
      <View style={{ flexShrink: 0, padding: space.md }}>
        <Button
          title="New chat"
          onPress={handleNewChat}
          style={{ width: '100%', justifyContent: 'flex-start' }}
          icon={<Ionicons name="add" size={18} color={colors.primaryForeground} />}
        />
      </View>

      {user ? (
        <ScrollView
          accessibilityLabel="Chat history"
          style={{ flex: 1, minHeight: 0, opacity: isResuming ? 0.6 : 1 }}
          contentContainerStyle={{ padding: space.sm, gap: 2 }}
          pointerEvents={isResuming ? 'none' : 'auto'}
          showsVerticalScrollIndicator={false}
        >
          <Eyebrow
            style={{ paddingHorizontal: space.md, paddingBottom: space.xs, paddingTop: space.sm }}
          >
            Recents
          </Eyebrow>
          {chats.length === 0 ? (
            <View style={{ paddingHorizontal: space.md, paddingVertical: space.xxxl }}>
              <Body size="sm" tone="onSurfaceVariant" style={{ textAlign: 'center' }}>
                No chats yet.
              </Body>
              <Body
                size="sm"
                tone="onSurfaceVariant"
                style={{ textAlign: 'center', marginTop: space.xs }}
              >
                Ask the materia medica a question and it will appear here.
              </Body>
            </View>
          ) : (
            chats.map((chat) => (
              <View
                key={chat.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: radius.md,
                }}
              >
                <Pressable
                  onPress={withHaptic(() => handleSelect(chat.id))}
                  accessibilityRole="button"
                  accessibilityLabel={chat.title}
                  accessibilityState={{ selected: chat.id === activeChatId }}
                  style={({ pressed }) => ({
                    minHeight: sizes.touch,
                    flex: 1,
                    minWidth: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.sm,
                    paddingHorizontal: space.md,
                    paddingVertical: space.sm,
                    paddingRight: space.xxl,
                    borderRadius: radius.md,
                    backgroundColor:
                      chat.id === activeChatId
                        ? colors.accent
                        : pressed
                          ? colors.surfaceLow
                          : 'transparent',
                  })}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={
                      chat.id === activeChatId
                        ? colors.accentForeground
                        : colors.onSurfaceVariant
                    }
                    style={{ flexShrink: 0 }}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Body
                      size="sm"
                      numberOfLines={1}
                      style={{
                        fontWeight: chat.id === activeChatId ? '500' : '400',
                        color:
                          chat.id === activeChatId
                            ? colors.accentForeground
                            : colors.onSurfaceVariant,
                      }}
                    >
                      {chat.title}
                    </Body>
                    <Body
                      size="xs"
                      tone="onSurfaceVariant"
                      numberOfLines={1}
                      style={{ marginTop: 1 }}
                    >
                      {formatChatDate(chat.updatedAt)}
                    </Body>
                  </View>
                </Pressable>

                <Pressable
                  onPress={withHaptic(() => setOptionsChat(chat))}
                  accessibilityRole="button"
                  accessibilityLabel={`Chat options for ${chat.title}`}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    position: 'absolute',
                    right: space.sm,
                    padding: space.sm,
                    borderRadius: radius.pill,
                    backgroundColor: pressed ? colors.surfaceLow : 'transparent',
                  })}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, minHeight: 0 }} />
      )}

      {user ? null : (
        <View
          style={{
            flexShrink: 0,
            margin: space.md,
            marginTop: 0,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
            backgroundColor: colors.surfaceLow,
            padding: space.lg,
          }}
        >
          <Body style={{ fontWeight: '500' }}>Sign in to save your chats</Body>
          <Body size="sm" tone="onSurfaceVariant" style={{ marginTop: space.xs }}>
            Your chat history is saved to your account and available on every device.
          </Body>
          <Button
            title="Sign in"
            onPress={() => router.push('/auth/login')}
            style={{ width: '100%', marginTop: space.md }}
          />
        </View>
      )}

      {/* Per-chat options: rename / delete. Web renders a dropdown menu. */}
      <Sheet open={optionsChat !== null} onClose={() => setOptionsChat(null)}>
        <View style={{ paddingTop: space.md, paddingBottom: space.xl }}>
          <Body
            numberOfLines={1}
            style={{ paddingHorizontal: space.xl, marginBottom: space.sm, fontWeight: '500' }}
          >
            {optionsChat?.title ?? ''}
          </Body>
          <SheetRow
            label="Rename"
            icon="pencil-outline"
            onPress={() => {
              if (optionsChat) {
                setRenameChatId(optionsChat.id);
                setRenameDraft(optionsChat.title);
              }
              setOptionsChat(null);
            }}
          />
          <SheetRow
            label="Delete chat"
            icon="trash-outline"
            destructive
            onPress={() => {
              if (optionsChat) setPendingDeleteId(optionsChat.id);
              setOptionsChat(null);
            }}
          />
        </View>
      </Sheet>

      {/* Rename chat sheet. Web renders a dialog. */}
      <Sheet
        open={renameChatSummary !== null}
        onClose={() => setRenameChatId(null)}
      >
        <View style={{ padding: space.xl }}>
          <Title>Rename chat</Title>
          <Body size="xs" tone="onSurfaceVariant" numberOfLines={1} style={{ marginTop: space.xs }}>
            {renameChatSummary?.title ?? ''}
          </Body>

          <Input
            label="Chat title"
            accessibilityLabel="Chat title"
            value={renameDraft}
            maxLength={CHAT_TITLE_MAX_LENGTH}
            onChangeText={setRenameDraft}
            autoFocus
            containerStyle={{ marginTop: space.md, marginBottom: 0 }}
            rightLabel={
              <Body size="xs" tone="onSurfaceVariant">
                Up to {CHAT_TITLE_MAX_LENGTH} characters
              </Body>
            }
          />

          <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.sm }}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setRenameChatId(null)}
              style={{ flex: 1 }}
            />
            <Button
              title="Save"
              disabled={
                !renameChatSummary ||
                renameDraft.trim().length === 0 ||
                renameDraft.trim() === renameChatSummary.title
              }
              onPress={handleSaveRename}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Sheet>

      {/* Delete confirmation sheet. Web renders a dialog. */}
      <Sheet
        open={pendingDeleteChat !== null}
        onClose={() => setPendingDeleteId(null)}
      >
        <View style={{ padding: space.xl }}>
          <Title>Delete chat?</Title>
          <Body size="sm" tone="onSurfaceVariant" style={{ marginTop: space.sm }}>
            {pendingDeleteChat
              ? `"${pendingDeleteChat.title}" will be permanently deleted. This cannot be undone.`
              : ''}
          </Body>

          <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setPendingDeleteId(null)}
              style={{ flex: 1 }}
            />
            <Button
              title="Delete"
              variant="destructive"
              disabled={!pendingDeleteChat}
              onPress={() => {
                if (pendingDeleteChat) void deleteChat(pendingDeleteChat.id);
                setPendingDeleteId(null);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
