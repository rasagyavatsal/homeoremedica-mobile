import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DatabaseGate } from '@/components/DatabaseGate';
import { Button } from '@/components/ui/Button';
import { Surface } from '@/components/ui/Surface';
import { Body, Display, Eyebrow, Mono, OrnamentRule, Rule } from '@/components/ui/Type';
import { radius, space, useTheme, withAlpha } from '@/constants/theme';
import { BookType, useAppContext } from '@/context/AppContext';
import { withHaptic } from '@/lib/haptics';

const books: { id: BookType; name: string; author: string }[] = [
  { id: 'boericke', name: 'Boericke', author: 'William Boericke' },
  { id: 'clarke', name: 'Clarke', author: 'John Henry Clarke' },
  { id: 'kent', name: 'Kent', author: 'James Tyler Kent' },
  { id: 'allen', name: 'Allen', author: 'Henry C. Allen' },
];

export default function FindRemedyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { selectedBook, selectedSymptoms, toggleSymptom, clearSymptoms } = useAppContext();

  const currentBook = books.find((b) => b.id === selectedBook) || books[0];
  const symptomSuffix = selectedSymptoms.length === 1 ? '' : 's';
  const hasSymptoms = selectedSymptoms.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <DatabaseGate>
        <ScrollView
          contentContainerStyle={{ padding: space.page, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Source */}
          <Eyebrow style={{ marginBottom: space.sm }}>Materia Medica</Eyebrow>
          <Pressable
            onPress={withHaptic(() => router.push('/select-book'))}
            accessible={false}
          >
            {({ pressed }) => (
              <Surface
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: space.lg,
                  gap: space.md,
                  opacity: pressed ? 0.9 : 1,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.sm,
                    borderWidth: 1,
                    borderColor: withAlpha(colors.primary, 0.35),
                    backgroundColor: withAlpha(colors.primary, 0.1),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="book-outline" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Display size="sm">{currentBook.name}</Display>
                  <Mono small style={{ marginTop: 2 }}>
                    {currentBook.author}
                  </Mono>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    borderWidth: 1,
                    borderColor: withAlpha(colors.tertiary, 0.35),
                    backgroundColor: withAlpha(colors.tertiary, 0.08),
                    borderRadius: radius.sm,
                    paddingVertical: 7,
                    paddingHorizontal: 10,
                  }}
                >
                  <Mono tone="tertiary" style={{ fontSize: 11 }}>
                    Change
                  </Mono>
                  <Ionicons name="chevron-forward" size={13} color={colors.tertiary} />
                </View>
              </Surface>
            )}
          </Pressable>

          {/* Add symptoms */}
          <Pressable
            onPress={withHaptic(() => router.push('/symptoms'))}
            accessibilityRole="button"
            accessibilityLabel="Add symptoms"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md,
              marginTop: space.xl,
              padding: space.lg,
              borderRadius: radius.md,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: withAlpha(colors.border, 0.6),
              backgroundColor: pressed ? withAlpha(colors.foreground, 0.04) : 'transparent',
            })}
          >
            <Ionicons name="add" size={22} color={colors.primary} />
            <Body size="lg" tone="primary" style={{ flex: 1, fontWeight: '600' }}>
              Add symptoms
            </Body>
            <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceVariant} />
          </Pressable>

          {/* Selected symptoms */}
          {hasSymptoms ? (
            <View style={{ marginTop: space.xl }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: space.md,
                }}
              >
                <Eyebrow>Selected symptoms</Eyebrow>
                <TouchableOpacity
                  onPress={withHaptic(clearSymptoms)}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Mono tone="tertiary" style={{ fontSize: 11 }}>
                    Clear all
                  </Mono>
                </TouchableOpacity>
              </View>

              <Surface>
                {selectedSymptoms.map((symptom, index) => (
                  <View
                    key={symptom}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.md,
                      paddingVertical: 12,
                      paddingHorizontal: space.lg,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: withAlpha(colors.border, 0.25),
                    }}
                  >
                    <Mono tone="tertiary" small>
                      {String(index + 1).padStart(2, '0')}
                    </Mono>
                    <Body style={{ flex: 1 }}>{symptom}</Body>
                    <TouchableOpacity
                      onPress={withHaptic(() => toggleSymptom(symptom))}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                ))}
              </Surface>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 56, paddingHorizontal: space.xxl }}>
              <Ionicons name="leaf-outline" size={48} color={withAlpha(colors.foreground, 0.25)} />
              <Display size="sm" style={{ marginTop: space.lg, textAlign: 'center' }}>
                No symptoms selected
              </Display>
              <OrnamentRule style={{ width: 120, marginTop: space.lg }} />
              <Body size="sm" tone="onSurfaceVariant" style={{ marginTop: space.lg, textAlign: 'center' }}>
                Add symptoms to rank matching remedies.
              </Body>
            </View>
          )}
        </ScrollView>

        {hasSymptoms ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.background,
              paddingHorizontal: space.page,
              paddingTop: space.md,
              paddingBottom: space.xxl,
            }}
          >
            <Rule variant="heavy" style={{ marginBottom: space.md }} />
            <Button
              onPress={() => router.push('/results')}
              title={`Find remedies (${selectedSymptoms.length} symptom${symptomSuffix})`}
              icon={<Ionicons name="search" size={18} color={colors.primaryForeground} />}
            />
          </View>
        ) : null}
      </DatabaseGate>
    </SafeAreaView>
  );
}
