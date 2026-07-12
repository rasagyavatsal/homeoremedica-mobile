import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Body, Mono, Rule } from '@/components/ui/Type';
import { radius, space, useTheme, withAlpha } from '@/constants/theme';
import { useAppContext } from '@/context/AppContext';
import { withHaptic } from '@/lib/haptics';

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

export default function SymptomsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    selectedSymptoms,
    toggleSymptom,
    isDbReady,
    searchSymptomsAsync,
    getSymptomsCountAsync,
  } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSymptoms = useCallback(
    async (query: string, reset: boolean = true) => {
      if (!isDbReady) return;

      if (reset) {
        setIsLoading(true);
        setOffset(0);
      }

      try {
        const newOffset = reset ? 0 : offset;
        const [results, count] = await Promise.all([
          searchSymptomsAsync(query, PAGE_SIZE, newOffset),
          reset ? getSymptomsCountAsync(query) : Promise.resolve(totalCount),
        ]);

        if (reset) {
          setSymptoms(results);
          setTotalCount(count);
        } else {
          setSymptoms((prev) => [...prev, ...results]);
        }
        setOffset(newOffset + PAGE_SIZE);
      } catch (error) {
        console.error('Error loading symptoms:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [isDbReady, searchSymptomsAsync, getSymptomsCountAsync, offset, totalCount]
  );

  useEffect(() => {
    if (!isDbReady) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadSymptoms(searchQuery, true);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, isDbReady]);

  useEffect(() => {
    if (isDbReady) {
      loadSymptoms('', true);
    }
  }, [isDbReady]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || symptoms.length >= totalCount) return;
    setIsLoadingMore(true);
    loadSymptoms(searchQuery, false);
  }, [isLoadingMore, symptoms.length, totalCount, searchQuery, loadSymptoms]);

  const isSelected = useCallback(
    (symptom: string) => selectedSymptoms.includes(symptom),
    [selectedSymptoms]
  );

  const renderSymptomItem = useCallback(
    ({ item }: { item: string }) => {
      const selected = isSelected(item);
      return (
        <Pressable
          onPress={withHaptic(() => toggleSymptom(item))}
          accessible
          accessibilityRole="checkbox"
          accessibilityLabel={item}
          accessibilityState={{ checked: selected }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md,
            paddingVertical: 13,
            paddingHorizontal: space.lg,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: selected ? withAlpha(colors.primary, 0.5) : withAlpha(colors.border, 0.3),
            backgroundColor: selected
              ? withAlpha(colors.primary, 0.08)
              : pressed
                ? withAlpha(colors.foreground, 0.04)
                : colors.surfaceBright,
          })}
        >
          <Ionicons
            name={selected ? 'checkbox' : 'square-outline'}
            size={20}
            color={selected ? colors.primary : withAlpha(colors.onSurfaceVariant, 0.7)}
          />
          <Body style={{ flex: 1 }}>{item}</Body>
        </Pressable>
      );
    },
    [isSelected, toggleSymptom, colors]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      {/* Search */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginHorizontal: space.page,
          marginTop: space.lg,
          marginBottom: space.sm,
          paddingHorizontal: 14,
          minHeight: 48,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: withAlpha(colors.border, 0.55),
          backgroundColor: colors.surfaceBright,
        }}
      >
        <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
        <TextInput
          style={{ flex: 1, fontSize: 16, color: colors.foreground, paddingVertical: 12 }}
          placeholder="Search symptoms..."
          placeholderTextColor={withAlpha(colors.onSurfaceVariant, 0.6)}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={withHaptic(() => setSearchQuery(''))}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        ) : null}
      </View>

      {!isLoading && totalCount > 0 ? (
        <Mono small style={{ paddingHorizontal: space.page, paddingBottom: space.sm }}>
          {totalCount.toLocaleString()} symptoms found
        </Mono>
      ) : null}

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Mono style={{ marginTop: space.md }}>Loading symptoms...</Mono>
        </View>
      ) : (
        <FlatList
          data={symptoms}
          renderItem={renderSymptomItem}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={{ padding: space.page, paddingTop: space.xs, gap: space.sm }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            isLoading ? null : (
              <View style={{ alignItems: 'center', paddingVertical: 56, paddingHorizontal: space.xxl }}>
                <Ionicons name="search-outline" size={44} color={withAlpha(colors.foreground, 0.25)} />
                <Body tone="onSurfaceVariant" style={{ marginTop: space.lg, textAlign: 'center' }}>
                  {searchQuery ? `No symptoms found for "${searchQuery}"` : 'No symptoms available'}
                </Body>
              </View>
            )
          }
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews
        />
      )}

      {/* Bottom bar */}
      {selectedSymptoms.length > 0 ? (
        <View
          style={{
            backgroundColor: colors.background,
            paddingHorizontal: space.page,
            paddingTop: space.md,
            paddingBottom: space.sm,
            gap: space.md,
          }}
        >
          <Rule variant="heavy" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: space.sm }}
            style={{ flexGrow: 0 }}
          >
            {selectedSymptoms.map((symptom) => (
              <View
                key={symptom}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  maxWidth: 200,
                  borderWidth: 1,
                  borderColor: withAlpha(colors.primary, 0.4),
                  backgroundColor: withAlpha(colors.primary, 0.08),
                  borderRadius: radius.sm,
                  paddingVertical: 6,
                  paddingLeft: 10,
                  paddingRight: 7,
                }}
              >
                <Mono tone="primary" small numberOfLines={1} style={{ flexShrink: 1 }}>
                  {symptom}
                </Mono>
                <TouchableOpacity
                  onPress={withHaptic(() => toggleSymptom(symptom))}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <Button
            onPress={() => router.push('/results')}
            title={`Find remedies (${selectedSymptoms.length})`}
            icon={<Ionicons name="search" size={18} color={colors.primaryForeground} />}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
