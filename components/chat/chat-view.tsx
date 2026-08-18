import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Surface } from '@/components/ui/Surface';
import { Body, Display, Eyebrow, Mono } from '@/components/ui/Type';
import { getSourceBookName } from '@/constants/books';
import {
  fonts,
  radius,
  sizes,
  space,
  type,
  useTheme,
  withAlpha,
} from '@/constants/theme';
import { CHAT_SAFETY_NOTICE } from '@/lib/chat-answer';
import { formatRemedyDisplayName } from '@/lib/format';
import { withHaptic } from '@/lib/haptics';
import type { ChatSource } from '@/types/chat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
}

/*
 * Max composer height: four body lines of text plus the input's vertical
 * padding, so the draft grows with the text but never crowds the thread.
 */
const COMPOSER_INPUT_MAX_HEIGHT = type.body.lineHeight * 4 + space.xl * 2;
const USER_BUBBLE_MAX_WIDTH = '88%';
const MESSAGE_MAX_LENGTH = 4000;

export function ChatEmptyState() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: space.page,
      }}
    >
      <Display size="sm" style={{ textAlign: 'center' }}>
        Ask the materia medica
      </Display>
      <Body
        size="lg"
        tone="onSurfaceVariant"
        style={{ marginTop: space.xl, textAlign: 'center' }}
      >
        Answers cite passages from Clarke, Boericke, Kent, and Allen.
      </Body>
    </View>
  );
}

function ChatSources({ sources }: Readonly<{ sources: ChatSource[] }>) {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState(false);

  const label = `${sources.length} ${sources.length === 1 ? 'source' : 'sources'}`;

  return (
    <View>
      <Pressable
        onPress={withHaptic(() => setOpen((current) => !current))}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        hitSlop={8}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          minHeight: sizes.touch,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          paddingHorizontal: space.md,
          borderRadius: radius.pill,
          backgroundColor: pressed ? colors.accent : 'transparent',
        })}
      >
        <Ionicons name="book-outline" size={16} color={colors.primary} />
        <Body size="sm" style={{ fontWeight: '500' }}>
          {label}
        </Body>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.onSurfaceVariant}
        />
      </Pressable>

      {open ? (
        <Surface radius="lg" style={{ marginTop: space.sm, overflow: 'hidden' }}>
          {sources.map((source, index) => (
            <View
              key={source.id}
              style={{
                padding: space.xl,
                borderBottomWidth: index === sources.length - 1 ? 0 : 1,
                borderBottomColor: withAlpha(
                  colors.border,
                  isDark ? 0.42 : 0.32,
                ),
              }}
            >
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <Eyebrow tone="primary">[{index + 1}]</Eyebrow>
                <View style={{ flex: 1, gap: space.xs }}>
                  <Body size="sm" style={{ fontWeight: '500' }}>
                    {formatRemedyDisplayName(source.remedyName)} ·{' '}
                    {source.sectionTitle}
                  </Body>
                  <Mono small>{getSourceBookName(source.bookId)}</Mono>
                </View>
              </View>
              <Body
                size="sm"
                tone="onSurfaceVariant"
                style={{ marginTop: space.md }}
              >
                {source.text}
              </Body>
            </View>
          ))}
        </Surface>
      ) : null}
    </View>
  );
}

function ChatMessageView({ message }: Readonly<{ message: ChatMessage }>) {
  if (message.role === 'user') {
    return (
      <View style={{ alignItems: 'flex-end' }}>
        <Surface
          radius="lg"
          style={{
            maxWidth: USER_BUBBLE_MAX_WIDTH,
            paddingHorizontal: space.lg,
            paddingVertical: space.md,
          }}
        >
          <Body size="sm">{message.content}</Body>
        </Surface>
      </View>
    );
  }

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.md }}>
        {message.content.split(/\n{2,}/).map((paragraph, index) => (
          <Body key={index}>{paragraph}</Body>
        ))}
      </View>
      {message.sources && message.sources.length > 0 ? (
        <ChatSources sources={message.sources} />
      ) : null}
    </View>
  );
}

export function ChatThread({
  messages,
  isSending,
  onNewChat,
}: Readonly<{
  messages: ChatMessage[];
  isSending: boolean;
  onNewChat: () => void;
}>) {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          alignItems: 'flex-end',
          paddingHorizontal: space.page,
          paddingTop: space.md,
          paddingBottom: space.sm,
        }}
      >
        <Button
          title="New chat"
          variant="ghost"
          onPress={onNewChat}
          icon={
            <Ionicons name="refresh" size={16} color={colors.onSurfaceVariant} />
          }
        />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <ChatMessageView message={item} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.page,
          paddingBottom: space.xl,
          gap: space.xxl,
        }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {isSending ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            paddingHorizontal: space.page,
            paddingBottom: space.sm,
          }}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Body size="sm" tone="onSurfaceVariant">
            Waiting for the answer…
          </Body>
        </View>
      ) : null}
    </View>
  );
}

export function ChatError({ error }: Readonly<{ error: string }>) {
  return (
    <View style={{ paddingHorizontal: space.page, paddingBottom: space.xs }}>
      <Callout variant="destructive">{error}</Callout>
    </View>
  );
}

export function ChatComposer({
  draft,
  isSending,
  onDraftChange,
  onSubmit,
}: Readonly<{
  draft: string;
  isSending: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
}>) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const canSend = draft.trim().length > 0 && !isSending;

  return (
    <View style={{ paddingHorizontal: space.page, paddingTop: space.sm }}>
      <Surface
        radius="lg"
        style={{
          borderColor: focused
            ? colors.primary
            : withAlpha(colors.border, isDark ? 0.42 : 0.32),
          paddingHorizontal: space.lg,
          paddingVertical: space.sm,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: space.md,
          }}
        >
          <TextInput
            accessibilityLabel="Message"
            value={draft}
            onChangeText={onDraftChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            multiline
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Ask about a remedy or symptom…"
            placeholderTextColor={colors.mutedForeground}
            style={{
              flex: 1,
              maxHeight: COMPOSER_INPUT_MAX_HEIGHT,
              paddingHorizontal: space.xs,
              paddingVertical: space.sm,
              fontFamily: fonts.body,
              fontSize: type.body.fontSize,
              lineHeight: type.body.lineHeight,
              color: colors.foreground,
              textAlignVertical: 'top',
            }}
          />
          <Pressable
            onPress={withHaptic(onSubmit, canSend)}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend, busy: isSending }}
            style={({ pressed }) => ({
              width: sizes.touch,
              height: sizes.touch,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSend ? colors.primary : colors.secondary,
              opacity: pressed && canSend ? 0.9 : 1,
              marginBottom: space.xs,
            })}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Ionicons
                name="arrow-up"
                size={18}
                color={canSend ? colors.primaryForeground : colors.onSurfaceVariant}
              />
            )}
          </Pressable>
        </View>
      </Surface>
      <Body
        size="sm"
        tone="onSurfaceVariant"
        style={{
          textAlign: 'center',
          marginTop: space.sm,
          marginBottom: space.sm,
        }}
      >
        {CHAT_SAFETY_NOTICE}
      </Body>
    </View>
  );
}
