import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/Badge';
import { Body, Eyebrow } from '@/components/ui/Type';
import {
  fonts,
  overlayShadow,
  radius,
  space,
  useTheme,
  withAlpha,
} from '@/constants/theme';
import { withHaptic } from '@/lib/haptics';

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

type SymptomSearchModalProps = {
  visible: boolean;
  activeBook: string;
  activeBookName: string;
  selectedSymptoms: string[];
  onClose: () => void;
  onToggleSymptom: (symptom: string) => void;
  searchSymptoms: (query: string, limit?: number, offset?: number) => Promise<string[]>;
  getSymptomsCount: (query: string) => Promise<number>;
};

export function SymptomSearchModal({
  visible,
  activeBook,
  activeBookName,
  selectedSymptoms,
  onClose,
  onToggleSymptom,
  searchSymptoms,
  getSymptomsCount,
}: Readonly<SymptomSearchModalProps>) {
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(focusTimer);
  }, [visible]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setTotalResults(0);
    setOffset(0);
    requestIdRef.current += 1;
  }, [activeBook]);

  useEffect(() => {
    const normalizedQuery = debouncedQuery.trim();
    const requestId = ++requestIdRef.current;

    if (normalizedQuery.length < 2) {
      setResults([]);
      setTotalResults(0);
      setOffset(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    Promise.all([
      searchSymptoms(normalizedQuery, PAGE_SIZE, 0),
      getSymptomsCount(normalizedQuery),
    ])
      .then(([nextResults, count]) => {
        if (requestId !== requestIdRef.current) return;
        setResults(nextResults);
        setTotalResults(count);
        setOffset(PAGE_SIZE);
      })
      .catch((error) => {
        if (requestId !== requestIdRef.current) return;
        console.error('Error searching symptoms:', error);
        setResults([]);
        setTotalResults(0);
        setOffset(0);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsSearching(false);
      });
  }, [debouncedQuery, getSymptomsCount, searchSymptoms]);

  const loadMore = useCallback(async () => {
    const normalizedQuery = debouncedQuery.trim();
    if (
      normalizedQuery.length < 2 ||
      isSearching ||
      isLoadingMore ||
      results.length >= totalResults
    ) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const nextResults = await searchSymptoms(normalizedQuery, PAGE_SIZE, offset);
      setResults((current) => [...current, ...nextResults]);
      setOffset((current) => current + PAGE_SIZE);
    } catch (error) {
      console.error('Error loading more symptoms:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    debouncedQuery,
    isLoadingMore,
    isSearching,
    offset,
    results.length,
    searchSymptoms,
    totalResults,
  ]);

  const normalizedQuery = debouncedQuery.trim();
  const showEmpty =
    normalizedQuery.length >= 2 && !isSearching && results.length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: withAlpha(colors.scrim, isDark ? 0.78 : 0.48),
        }}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close search"
        />
        <KeyboardAvoidingView
          pointerEvents="box-none"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, paddingHorizontal: space.page, paddingVertical: space.md }}
        >
          <View
            style={[
              {
                overflow: 'hidden',
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: colors.card,
              },
              overlayShadow,
            ]}
          >
            <View
              style={{
                minHeight: 60,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Ionicons name="search" size={18} color={colors.primary} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search symptom keywords…"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search symptom keywords"
                style={{
                  flex: 1,
                  minHeight: 44,
                  paddingVertical: 10,
                  fontFamily: fonts.body,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
              {isSearching ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : null}
              {query ? (
                <Pressable
                  onPress={withHaptic(() => setQuery(''))}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.md,
                    backgroundColor: pressed ? colors.accent : 'transparent',
                  })}
                >
                  <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {normalizedQuery.length >= 2 ? (
            <View
              style={[
                {
                  flex: 1,
                  marginTop: space.md,
                  overflow: 'hidden',
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
                  backgroundColor: colors.card,
                },
                overlayShadow,
              ]}
            >
              <View
                style={{
                  minHeight: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: space.md,
                  paddingHorizontal: space.lg,
                  paddingVertical: space.md,
                  borderBottomWidth: 1,
                  borderBottomColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
                }}
              >
                <Body size="sm" style={{ fontWeight: '500' }}>
                  Matching indications
                </Body>
                <Eyebrow>
                  {totalResults.toLocaleString()} {totalResults === 1 ? 'indication' : 'indications'}
                </Eyebrow>
              </View>

              <FlatList
                data={results}
                keyExtractor={(item, index) => `${item}-${index}`}
                keyboardShouldPersistTaps="handled"
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                renderItem={({ item }) => {
                  const selected = selectedSymptoms.includes(item);
                  return (
                    <Pressable
                      onPress={withHaptic(() => onToggleSymptom(item))}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={item}
                      style={({ pressed }) => ({
                        minHeight: 68,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: space.lg,
                        paddingHorizontal: space.lg,
                        paddingVertical: space.md,
                        borderBottomWidth: 1,
                        borderBottomColor: withAlpha(
                          colors.border,
                          isDark ? 0.42 : 0.32,
                        ),
                        backgroundColor:
                          selected || pressed ? colors.accent : colors.card,
                      })}
                    >
                      <View style={{ minWidth: 0, flex: 1, gap: 4 }}>
                        <Body size="sm" style={{ fontWeight: '500' }}>
                          {item}
                        </Body>
                        <Eyebrow>{activeBookName}</Eyebrow>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: space.sm,
                        }}
                      >
                        {selected ? <Badge>Selected</Badge> : null}
                        <Ionicons
                          name={selected ? 'checkmark' : 'add'}
                          size={18}
                          color={selected ? colors.primary : colors.onSurfaceVariant}
                        />
                      </View>
                    </Pressable>
                  );
                }}
                ListFooterComponent={
                  isLoadingMore ? (
                    <View style={{ alignItems: 'center', paddingVertical: space.xl }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : null
                }
                ListEmptyComponent={
                  showEmpty ? (
                    <View style={{ padding: space.xl }}>
                      <Body size="sm" tone="onSurfaceVariant">
                        No symptoms found. Try a narrower phrase.
                      </Body>
                    </View>
                  ) : null
                }
              />
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <View style={{ alignItems: 'center', paddingTop: space.md }}>
            <Pressable
              onPress={withHaptic(onClose)}
              accessibilityRole="button"
              accessibilityLabel="Close search"
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
                backgroundColor: colors.card,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              })}
            >
              <Ionicons name="close" size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
