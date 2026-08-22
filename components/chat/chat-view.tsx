import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import { Callout } from '@/components/ui/Callout';
import { Surface } from '@/components/ui/Surface';
import { Body, Display, Eyebrow, Mono } from '@/components/ui/Type';
import { getSourceBookName } from '@/constants/books';
import {
  fonts,
  layout,
  radius,
  sizes,
  space,
  type,
  useTheme,
  withAlpha,
} from '@/constants/theme';
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
const MESSAGE_MAX_LENGTH = 4000;
const MESSAGE_COLLAPSE_LENGTH = 320;

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
        tone="onSurfaceVariant"
        style={{ marginTop: space.xl, textAlign: 'center' }}
      >
        Answers draw only from Clarke, Boericke, Kent, and Allen.
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

/**
 * Cuts a long message at a word boundary for the collapsed preview, or
 * returns null when the message is short enough to render in full. Kept in
 * sync with apps/web/components/chat-view.tsx.
 */
function truncateMessage(content: string) {
  if (content.length <= MESSAGE_COLLAPSE_LENGTH) return null;

  const boundary = content.lastIndexOf(' ', MESSAGE_COLLAPSE_LENGTH);
  const end = boundary > MESSAGE_COLLAPSE_LENGTH / 2 ? boundary : MESSAGE_COLLAPSE_LENGTH;
  return `${content.slice(0, end)}…`;
}

function UserMessageView({ content }: Readonly<{ content: string }>) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const collapsedText = truncateMessage(content);
  const isCollapsible = collapsedText !== null;

  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Surface
        radius="lg"
        style={{
          maxWidth: layout.chatBubble,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
        }}
      >
        <Body size="sm">{isCollapsible && !expanded ? collapsedText : content}</Body>
        {isCollapsible ? (
          <Pressable
            onPress={withHaptic(() => setExpanded((current) => !current))}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            hitSlop={8}
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.xs,
              marginTop: space.sm,
            }}
          >
            <Body size="xs" tone="primary" style={{ fontWeight: '500' }}>
              {expanded ? 'Show less' : 'Show more'}
            </Body>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.primary}
            />
          </Pressable>
        ) : null}
      </Surface>
    </View>
  );
}

type EmphasisRun = { type: 'text' | 'strong'; value: string };

const EMPHASIS_PATTERN = /(\*\*[^*]+\*\*)|\*([^*\n]+)\*/g;

/**
 * Splits an answer paragraph into text and strong runs. Balanced **bold**
 * and *starred* runs become strong; any orphan asterisks left in plain text
 * are dropped so a stray star never renders. Kept in sync with
 * apps/web/components/chat-view.tsx.
 */
function parseEmphasisRuns(text: string): EmphasisRun[] {
  const runs: EmphasisRun[] = [];
  let cursor = 0;

  for (const match of text.matchAll(EMPHASIS_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) runs.push({ type: 'text', value: text.slice(cursor, index) });
    const value = match[1] !== undefined ? match[1].slice(2, -2) : (match[2] ?? '');
    runs.push({ type: 'strong', value });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) runs.push({ type: 'text', value: text.slice(cursor) });

  return runs
    .map((run) => (run.type === 'text' ? { ...run, value: run.value.replace(/\*/g, '') } : run))
    .filter((run) => run.value !== '');
}

/** Renders starred and double-starred spans in assistant answers as bold text. */
function BoldText({ text }: Readonly<{ text: string }>) {
  return (
    <>
      {parseEmphasisRuns(text).map((run, index) =>
        run.type === 'strong' ? (
          <Body key={index} style={{ fontWeight: '600' }}>
            {run.value}
          </Body>
        ) : (
          <React.Fragment key={index}>{run.value}</React.Fragment>
        ),
      )}
    </>
  );
}

function ChatMessageView({ message }: Readonly<{ message: ChatMessage }>) {
  if (message.role === 'user') {
    return <UserMessageView content={message.content} />;
  }

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.md }}>
        {message.content.split(/\n{2,}/).map((paragraph, index) => (
          <Body key={index}>
            <BoldText text={paragraph} />
          </Body>
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
}: Readonly<{
  messages: ChatMessage[];
  isSending: boolean;
}>) {
  const { colors } = useTheme();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <ChatMessageView message={item} />}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.xxl,
          paddingVertical: space.sm,
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
            paddingHorizontal: space.xxl,
            paddingBottom: space.sm,
          }}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Body size="sm" tone="onSurfaceVariant">
            Waiting for the answer
          </Body>
        </View>
      ) : null}
    </View>
  );
}

export function ChatError({ error }: Readonly<{ error: string }>) {
  return (
    <View style={{ paddingHorizontal: space.xxl, paddingBottom: space.xs }}>
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
    <View style={{ paddingHorizontal: space.xxl, paddingTop: space.sm, paddingBottom: space.md }}>
      <Surface
        radius="lg"
        tone="surface"
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
    </View>
  );
}
