import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Mono } from '@/components/ui/Type';
import { Surface } from '@/components/ui/Surface';
import { radius, space, useTheme, withAlpha } from '@/constants/theme';
import { BookType, useAppContext } from '@/context/AppContext';
import { withHaptic } from '@/lib/haptics';

type SourceBook = {
  id: BookType;
  shortLabel: string;
  name: string;
  cover: ImageSourcePropType;
};

const sourceCoverSize = {
  width: 112,
  height: 150,
} as const;
const sourceCardHeight = 264;

const books: SourceBook[] = [
  {
    id: 'boericke',
    shortLabel: 'Boericke',
    name: "Boericke's Materia Medica",
    cover: require('../assets/images/source-covers/boericke.jpg'),
  },
  {
    id: 'clarke',
    shortLabel: 'Clarke',
    name: "Clarke's Dictionary of Practical Materia Medica",
    cover: require('../assets/images/source-covers/clarke.jpg'),
  },
  {
    id: 'kent',
    shortLabel: 'Kent',
    name: "Kent's Lectures on Homoeopathic Materia Medica",
    cover: require('../assets/images/source-covers/kent.jpg'),
  },
  {
    id: 'allen',
    shortLabel: 'Allen',
    name: "Allen's Keynotes",
    cover: require('../assets/images/source-covers/allen.jpg'),
  },
];

export default function SelectMateriaMedicaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { selectedBook, setSelectedBook, clearSymptoms } = useAppContext();
  const { width } = useWindowDimensions();
  const cardGap = space.md;
  const cardWidth = Math.floor((width - space.page * 2 - cardGap) / 2);

  const handleSelectBook = (bookId: BookType) => {
    setSelectedBook(bookId);
    clearSymptoms();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.page, gap: space.lg }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: cardGap }}>
          {books.map((book) => {
            const selected = selectedBook === book.id;
            return (
              <Pressable
                key={book.id}
                onPress={withHaptic(() => handleSelectBook(book.id))}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Select source: ${book.name}`}
                accessibilityState={{ selected }}
                testID={`book-option-${book.id}`}
                style={({ pressed }) => ({ width: cardWidth, opacity: pressed ? 0.9 : 1 })}
              >
                {() => (
                  <Surface
                    testID={`book-card-${book.id}`}
                    radius="sm"
                    style={{
                      height: sourceCardHeight,
                      padding: space.sm,
                      borderColor: selected ? withAlpha(colors.primary, 0.55) : withAlpha(colors.border, 0.4),
                      backgroundColor: selected ? withAlpha(colors.primary, 0.08) : colors.surfaceBright,
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
                              borderRadius: radius.sm,
                              backgroundColor: colors.primary,
                            }}
                          >
                            <Ionicons name="checkmark" size={15} color={colors.primaryForeground} />
                          </View>
                        ) : null}
                      </View>

                      <View style={{ gap: 4, paddingHorizontal: 2, paddingBottom: 2 }}>
                        <Mono small tone="foreground" style={{ fontWeight: '700' }}>
                          {book.shortLabel}
                        </Mono>
                        <Body size="sm" tone="onSurfaceVariant">
                          {book.name}
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
  );
}
