import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { BrandLockup } from '@/components/BrandLockup';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { Body, Eyebrow } from '@/components/ui/Type';
import { fonts, radius, sizes, space, useTheme, withAlpha } from '@/constants/theme';
import { isGoogleUser } from '@/lib/auth/firebase-auth';
import { withHaptic } from '@/lib/haptics';
import { CHAT_TITLE_MAX_LENGTH, formatChatDate } from '@/lib/services/chat-history';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { ChatSummary } from '@/types/chat-history';
import type { User } from '@/types';

/**
 * Presentational chat-history panel, ported from the web app's
 * components/chat-sidebar.tsx. Rendering contexts:
 * - web desktop: persistent aside on /chat
 * - web mobile / native: inside the left-docked history Sheet
 * The owner (the chat screen) supplies state and mutations; this component
 * only manages its own per-chat options sheet (rename/delete), the rename
 * sheet, the delete confirmation sheet, and the account actions sheet.
 * Web dropdown menus and dialogs become bottom sheets on native.
 */
export interface ChatSidebarProps {
  user: User | null;
  chats: ChatSummary[];
  activeChatId: string | null;
  isResuming: boolean;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, title: string) => void;
  onNavigate?: () => void;
}

interface SheetRowProps {
  label: string;
  icon: IoniconsName;
  destructive?: boolean;
  onPress: () => void;
}

type IoniconsName = keyof typeof Ionicons.glyphMap;

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
        paddingHorizontal: space.lg,
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

export function ChatSidebar({
  user,
  chats,
  activeChatId,
  isResuming,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onNavigate,
}: ChatSidebarProps) {
  const { colors, isDark, resolvedTheme } = useTheme();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [optionsChat, setOptionsChat] = useState<ChatSummary | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const renameChat = chats.find((chat) => chat.id === renameChatId) ?? null;
  const pendingDeleteChat = chats.find((chat) => chat.id === pendingDeleteId) ?? null;

  const handleSelect = (chatId: string) => {
    onSelectChat(chatId);
    onNavigate?.();
  };

  const openRename = (chat: ChatSummary) => {
    setOptionsChat(null);
    setRenameChatId(chat.id);
    setRenameDraft(chat.title);
  };

  const handleSaveRename = () => {
    const nextTitle = renameDraft.trim();
    if (!renameChat || !nextTitle || nextTitle === renameChat.title) return;
    onRenameChat(renameChat.id, nextTitle);
    setRenameChatId(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setAccountOpen(false);
      onNavigate?.();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const usesGoogleProvider = user ? isGoogleUser() : false;
  const initial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View
        style={{
          flexShrink: 0,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
        }}
      >
        <Pressable
          onPress={withHaptic(() => onNavigate?.())}
          accessibilityRole="button"
          accessibilityLabel="HomeoRemedica home"
          style={{ minHeight: sizes.touch, justifyContent: 'center' }}
        >
          <BrandLockup />
        </Pressable>
      </View>

      <View style={{ flexShrink: 0, padding: space.md }}>
        <Button
          title="New chat"
          onPress={onNewChat}
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
                            : colors.foreground,
                      }}
                    >
                      {chat.title}
                    </Body>
                    <Body
                      size="sm"
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

      <View
        style={{
          flexShrink: 0,
          borderTopWidth: 1,
          borderTopColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
          padding: space.sm,
        }}
      >
        {user ? (
          <Pressable
            onPress={withHaptic(() => setAccountOpen(true))}
            accessibilityRole="button"
            accessibilityLabel="Account menu"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              borderRadius: radius.lg,
              padding: space.sm,
              backgroundColor: pressed ? colors.surfaceLow : 'transparent',
            })}
          >
            <View
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.md,
                backgroundColor: colors.accent,
              }}
            >
              <Body
                style={{
                  color: colors.accentForeground,
                  fontFamily: fonts.display,
                  fontWeight: '500',
                }}
              >
                {initial}
              </Body>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Body size="sm" numberOfLines={1} style={{ fontWeight: '500' }}>
                {user.name || 'Account'}
              </Body>
              <Body size="sm" tone="onSurfaceVariant" numberOfLines={1}>
                {user.email}
              </Body>
            </View>
          </Pressable>
        ) : (
          <View
            style={{
              margin: space.xs,
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
              onPress={() => {
                onNavigate?.();
                router.push('/auth/login');
              }}
              style={{ width: '100%', marginTop: space.md }}
            />
          </View>
        )}
      </View>

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
            onPress={() => optionsChat && openRename(optionsChat)}
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

      {/* Account actions: theme, password, log out. Web renders a dropdown menu. */}
      <Sheet open={accountOpen} onClose={() => setAccountOpen(false)}>
        <View style={{ paddingTop: space.md, paddingBottom: space.xl }}>
          {user ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.md,
                borderBottomWidth: 1,
                borderBottomColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
                paddingHorizontal: space.xl,
                paddingBottom: space.lg,
                marginBottom: space.sm,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.pill,
                  backgroundColor: colors.accent,
                }}
              >
                <Body
                  style={{
                    color: colors.accentForeground,
                    fontFamily: fonts.display,
                    fontWeight: '500',
                  }}
                >
                  {initial}
                </Body>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Body style={{ fontWeight: '500' }} numberOfLines={1}>
                  {user.name || 'Account'}
                </Body>
                <Body size="sm" tone="onSurfaceVariant" numberOfLines={1}>
                  {user.email}
                </Body>
              </View>
            </View>
          ) : null}

          <View
            style={{
              minHeight: sizes.touch,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              paddingHorizontal: space.xl,
              paddingVertical: space.md,
            }}
          >
            <Ionicons
              name={resolvedTheme === 'dark' ? 'moon-outline' : 'sunny-outline'}
              size={20}
              color={colors.foreground}
            />
            <Body style={{ flex: 1, fontWeight: '500' }}>Appearance</Body>
            <ThemeToggle />
          </View>

          {usesGoogleProvider ? null : (
            <SheetRow
              label="Change password"
              icon="key-outline"
              onPress={() => {
                setAccountOpen(false);
                onNavigate?.();
                router.push('/auth/change-password');
              }}
            />
          )}

          <SheetRow label="Log out" icon="log-out-outline" destructive onPress={() => void handleLogout()} />
        </View>
      </Sheet>

      {/* Rename chat sheet. Web renders a dialog. */}
      <Sheet
        open={renameChat !== null}
        onClose={() => setRenameChatId(null)}
      >
        <View style={{ padding: space.xl }}>
          <Body style={{ fontSize: 20, lineHeight: 24, fontWeight: '500' }}>
            Rename chat
          </Body>
          <Body size="sm" tone="onSurfaceVariant" numberOfLines={1} style={{ marginTop: space.xs }}>
            {renameChat?.title ?? ''}
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
              <Body size="sm" tone="onSurfaceVariant">
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
                !renameChat ||
                renameDraft.trim().length === 0 ||
                renameDraft.trim() === renameChat.title
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
          <Body style={{ fontSize: 20, lineHeight: 24, fontWeight: '500' }}>
            Delete chat?
          </Body>
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
                if (pendingDeleteChat) onDeleteChat(pendingDeleteChat.id);
                setPendingDeleteId(null);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </Sheet>
    </View>
  );
}
