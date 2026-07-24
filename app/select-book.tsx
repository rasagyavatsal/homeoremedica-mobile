import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Eyebrow } from '@/components/ui/Type';
import { Button } from '@/components/ui/Button';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Surface } from '@/components/ui/Surface';
import { SOURCE_BOOKS } from '@/constants/books';
import { radius, space, useTheme, withAlpha } from '@/constants/theme';
import { BookType, useAppContext } from '@/context/AppContext';
import { withHaptic } from '@/lib/haptics';

const sourceCoverSize = {
  width: 80,
  height: 112,
} as const;
const sourceCardHeight = 224;

export default function SelectMateriaMedicaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    selectedBook,
    selectedSymptoms = [],
    setSelectedBook,
    clearSymptoms,
  } = useAppContext();
  const { width } = useWindowDimensions();
  const [pendingBook, setPendingBook] = useState<BookType | null>(null);
  const cardGap = space.md;
  const cardWidth = Math.floor((width - space.page * 2 - cardGap) / 2);

  const closePicker = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const applyBookSelection = (bookId: BookType) => {
    setSelectedBook(bookId);
    clearSymptoms();
    closePicker();
  };

  const handleSelectBook = (bookId: BookType) => {
    if (bookId === selectedBook) {
      closePicker();
      return;
    }

    if (selectedSymptoms.length > 0) {
      setPendingBook(bookId);
      return;
    }

    applyBookSelection(bookId);
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={{ padding: space.page, gap: space.lg }}
          showsVerticalScrollIndicator={false}
        >
          <Body size="sm" tone="onSurfaceVariant">
            Choose the source book used for remedy matching.
          </Body>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: cardGap }}>
            {SOURCE_BOOKS.map((book) => {
              const selected = selectedBook === book.id;
              return (
                <Pressable
                  key={book.id}
                  onPress={withHaptic(() => handleSelectBook(book.id))}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel={`Select source: ${book.fullName}`}
                  accessibilityState={{ selected }}
                  testID={`book-option-${book.id}`}
                  style={({ pressed }) => ({ width: cardWidth, opacity: pressed ? 0.9 : 1 })}
                >
                  {() => (
                    <Surface
                      testID={`book-card-${book.id}`}
                      radius="lg"
                      elevated={false}
                      tone="bright"
                      style={{
                        height: sourceCardHeight,
                        padding: space.sm,
                        borderColor: selected
                          ? colors.primary
                          : withAlpha(colors.border, 0.42),
                        backgroundColor: selected ? colors.accent : colors.surfaceBright,
                      }}
                    >
                      <View style={{ gap: 7 }}>
                        <View
                          style={{
                            alignSelf: 'center',
                            ...sourceCoverSize,
                            overflow: 'hidden',
                            borderRadius: radius.sm,
                            borderWidth: 1,
                            borderColor: withAlpha(colors.foreground, 0.2),
                            backgroundColor: withAlpha(colors.primary, selected ? 0.16 : 0.08),
                          }}
                        >
                          <Image
                            source={book.cover}
                            resizeMode="cover"
                            testID={`source-cover-${book.id}`}
                            style={sourceCoverSize}
                            accessible={false}
                            importantForAccessibility="no"
                          />
                          {selected ? (
                            <View
                              testID={`source-selected-check-${book.id}`}
                              style={{
                                position: 'absolute',
                                right: 5,
                                top: 5,
                                width: 22,
                                height: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: radius.pill,
                                backgroundColor: colors.primary,
                              }}
                            >
                              <Ionicons name="checkmark" size={15} color={colors.primaryForeground} />
                            </View>
                          ) : null}
                        </View>

                        <View style={{ gap: 4, paddingHorizontal: 2, paddingBottom: 2 }}>
                          <Eyebrow tone="foreground">
                            {book.shortName}
                          </Eyebrow>
                          <Body
                            size="sm"
                            tone="onSurfaceVariant"
                            style={{ fontSize: 12, lineHeight: 16 }}
                          >
                            {book.fullName}
                          </Body>
                        </View>
                      </View>
                    </Surface>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      <ModalSheet
        visible={pendingBook !== null}
        onClose={() => setPendingBook(null)}
        title="Change source?"
        description="Changing the source will clear the current search."
        icon={<Ionicons name="book-outline" size={20} color={colors.accentForeground} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: space.md }}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setPendingBook(null)}
            style={{ flex: 1 }}
          />
          <Button
            title="Change source"
            onPress={() => {
              if (!pendingBook) return;
              const nextBook = pendingBook;
              setPendingBook(null);
              applyBookSelection(nextBook);
            }}
            style={{ flex: 2 }}
          />
        </View>
      </ModalSheet>
    </>
  );
}
