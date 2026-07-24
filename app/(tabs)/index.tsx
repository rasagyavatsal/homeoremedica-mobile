import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Symptom } from '@homeoremedica/shared';

import { DatabaseGate } from '@/components/DatabaseGate';
import { SymptomSearchModal } from '@/components/finder/SymptomSearchModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Surface } from '@/components/ui/Surface';
import { Body, Display, Eyebrow } from '@/components/ui/Type';
import { fonts, radius, space, useTheme, withAlpha } from '@/constants/theme';
import { getSourceBookName } from '@/constants/books';
import { useAppContext } from '@/context/AppContext';
import { formatRemedyDisplayName } from '@/lib/format';
import { withHaptic } from '@/lib/haptics';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useCasesStore } from '@/lib/stores/cases-store';

type RemedyResult = {
  remedy: string;
  slug: string;
  matchedSymptoms: string[];
};

type FindStatus = 'idle' | 'loading' | 'success' | 'error';

function summarizeMatches(matches: string[]) {
  const preview = matches.slice(0, 3);
  const remaining = matches.length - preview.length;
  return remaining > 0
    ? `${preview.join(' · ')} · +${remaining} more`
    : preview.join(' · ');
}

export default function FindRemedyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const {
    selectedBook,
    selectedSymptoms,
    toggleSymptom,
    clearSymptoms,
    searchSymptomsAsync,
    getSymptomsCountAsync,
    findRemediesAsync,
  } = useAppContext();
  const { user } = useAuthStore();
  const { addCase } = useCasesStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [results, setResults] = useState<RemedyResult[]>([]);
  const [findStatus, setFindStatus] = useState<FindStatus>('idle');
  const [saveOpen, setSaveOpen] = useState(false);
  const [caseName, setCaseName] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const activeBookName = getSourceBookName(selectedBook);
  const isFinding = findStatus === 'loading';

  useEffect(() => {
    let active = true;

    if (selectedSymptoms.length === 0) {
      setResults([]);
      setFindStatus('idle');
      return () => {
        active = false;
      };
    }

    setFindStatus('loading');
    findRemediesAsync()
      .then((nextResults) => {
        if (!active) return;
        setResults(
          [...nextResults].sort((left, right) => {
            const scoreDifference =
              right.matchedSymptoms.length - left.matchedSymptoms.length;
            return scoreDifference || left.remedy.localeCompare(right.remedy);
          }),
        );
        setFindStatus('success');
      })
      .catch((error) => {
        if (!active) return;
        console.error('Error finding remedies:', error);
        setResults([]);
        setFindStatus('error');
      });

    return () => {
      active = false;
    };
  }, [findRemediesAsync, selectedBook, selectedSymptoms]);

  const openSavedCases = () => {
    router.push(user ? '/cases' : '/auth/login');
  };

  const openSaveCase = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setSaveError('');
    setCaseName('');
    setSaveOpen(true);
  };

  const saveCase = async () => {
    if (!caseName.trim()) return;

    setIsSaving(true);
    setSaveError('');
    try {
      const symptomObjects: Symptom[] = selectedSymptoms.map((name) => ({
        id: `rn-${name}`,
        name,
        books: [selectedBook],
      }));
      await addCase(caseName.trim(), symptomObjects, selectedBook);
      setSaveOpen(false);
      Alert.alert('Case saved', 'The current search is now available in Saved cases.', [
        { text: 'View cases', onPress: () => router.push('/cases') },
        { text: 'Done' },
      ]);
    } catch (error: any) {
      setSaveError(error?.message || 'Failed to save case. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <DatabaseGate>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: space.page,
            paddingTop: space.xl,
            paddingBottom: space.xxxl,
            gap: space.xl,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              gap: space.sm,
            }}
          >
            <Button
              title={`Source · ${activeBookName}`}
              variant="outline"
              onPress={() => router.push('/select-book')}
              icon={<Ionicons name="book-outline" size={17} color={colors.primary} />}
            />
            <Button
              title="Saved cases"
              variant="ghost"
              onPress={openSavedCases}
              icon={
                <Ionicons
                  name="document-text-outline"
                  size={17}
                  color={colors.onSurfaceVariant}
                />
              }
            />
          </View>

          <Pressable
            onPress={withHaptic(() => setSearchOpen(true))}
            accessibilityRole="button"
            accessibilityLabel="Search symptom keywords"
          >
            {({ pressed }) => (
              <Surface
                style={{
                  minHeight: 60,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderColor: pressed
                    ? colors.primary
                    : withAlpha(colors.border, isDark ? 0.42 : 0.32),
                  opacity: pressed ? 0.92 : 1,
                  transform: [{ scale: pressed ? 0.995 : 1 }],
                }}
              >
                <Ionicons name="search" size={18} color={colors.primary} />
                <TextInput
                  editable={false}
                  pointerEvents="none"
                  placeholder="Search symptom keywords…"
                  placeholderTextColor={colors.mutedForeground}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    paddingVertical: 10,
                    fontFamily: fonts.body,
                    fontSize: 16,
                    color: colors.foreground,
                  }}
                />
              </Surface>
            )}
          </Pressable>

          {selectedSymptoms.length > 0 ? (
            <Surface style={{ overflow: 'hidden' }}>
              <View
                style={{
                  gap: space.lg,
                  padding: space.xl,
                  borderBottomWidth: 1,
                  borderBottomColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
                }}
              >
                <View style={{ gap: 6 }}>
                  <Display size="sm">Selected symptoms</Display>
                  <Eyebrow>
                    {selectedSymptoms.length}{' '}
                    {selectedSymptoms.length === 1 ? 'entry' : 'entries'} · {activeBookName}
                  </Eyebrow>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  <Button title="Save case" variant="outline" onPress={openSaveCase} />
                  <Button title="Clear all" variant="ghost" onPress={clearSymptoms} />
                </View>
              </View>

              <View style={{ paddingHorizontal: space.xl, paddingVertical: space.sm }}>
                {selectedSymptoms.map((symptom, index) => (
                  <View
                    key={symptom}
                    style={{
                      minHeight: 52,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: space.md,
                      paddingVertical: space.md,
                      borderBottomWidth:
                        index === selectedSymptoms.length - 1 ? 0 : 1,
                      borderBottomColor: withAlpha(
                        colors.border,
                        isDark ? 0.42 : 0.32,
                      ),
                    }}
                  >
                    <Eyebrow tone="primary">
                      {String(index + 1).padStart(2, '0')}
                    </Eyebrow>
                    <Body size="sm" style={{ flex: 1 }}>
                      {symptom}
                    </Body>
                    <Pressable
                      onPress={withHaptic(() => toggleSymptom(symptom))}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${symptom}`}
                      hitSlop={8}
                      style={({ pressed }) => ({
                        width: 40,
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: radius.md,
                        backgroundColor: pressed ? colors.accent : 'transparent',
                      })}
                    >
                      <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </Surface>
          ) : null}

          {isFinding ? (
            <Callout
              icon={<ActivityIndicator size="small" color={colors.primary} />}
            >
              Finding matching remedies…
            </Callout>
          ) : null}

          {findStatus === 'error' ? (
            <Callout
              variant="destructive"
              icon={
                <Ionicons
                  name="cloud-offline-outline"
                  size={18}
                  color={colors.destructive}
                />
              }
            >
              <View style={{ gap: space.xs }}>
                <Body size="sm" tone="destructive" style={{ fontWeight: '500' }}>
                  Unable to find remedies
                </Body>
                <Body size="sm" tone="onSurfaceVariant">
                  Check your connection and try the search again.
                </Body>
              </View>
            </Callout>
          ) : null}

          {findStatus === 'success' &&
          selectedSymptoms.length > 0 &&
          results.length === 0 ? (
            <Surface style={{ alignItems: 'center', padding: space.xxl }}>
              <Ionicons
                name="search-outline"
                size={36}
                color={withAlpha(colors.foreground, 0.28)}
              />
              <Display size="sm" style={{ marginTop: space.lg, textAlign: 'center' }}>
                No remedies found
              </Display>
              <Body
                size="sm"
                tone="onSurfaceVariant"
                style={{ marginTop: space.sm, textAlign: 'center' }}
              >
                Nothing in {activeBookName} matches these symptoms.
              </Body>
            </Surface>
          ) : null}

          {findStatus === 'success' && results.length > 0 ? (
            <Surface style={{ overflow: 'hidden' }}>
              <View
                style={{
                  gap: 6,
                  padding: space.xl,
                  borderBottomWidth: 1,
                  borderBottomColor: withAlpha(colors.border, isDark ? 0.42 : 0.32),
                }}
              >
                <Display size="sm">Matching remedies</Display>
                <Eyebrow>
                  {results.length} {results.length === 1 ? 'remedy' : 'remedies'} ·{' '}
                  {activeBookName}
                </Eyebrow>
              </View>

              <View style={{ gap: space.lg, padding: space.xl }}>
                <Callout
                  variant="info"
                  icon={
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color={colors.primary}
                    />
                  }
                >
                  These results are for reference only. Consult a qualified practitioner
                  before treatment.
                </Callout>

                <View>
                  {results.map((result, index) => {
                    const score = result.matchedSymptoms.length;
                    return (
                      <View
                        key={`${result.slug}-${result.remedy}`}
                        style={{
                          paddingHorizontal: space.xs,
                          paddingVertical: space.xl,
                          borderBottomWidth: index === results.length - 1 ? 0 : 1,
                          borderBottomColor: withAlpha(
                            colors.border,
                            isDark ? 0.42 : 0.32,
                          ),
                        }}
                      >
                        <Body size="lg" style={{ fontWeight: '500' }}>
                          {formatRemedyDisplayName(result.remedy)}
                        </Body>
                        <View
                          style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: space.sm,
                            marginTop: space.sm,
                          }}
                        >
                          <Badge>
                            Matches {score} of {selectedSymptoms.length}
                          </Badge>
                          <Badge variant="outline">{activeBookName}</Badge>
                        </View>
                        {score > 0 ? (
                          <Body
                            size="sm"
                            tone="onSurfaceVariant"
                            style={{ marginTop: space.sm }}
                          >
                            {summarizeMatches(result.matchedSymptoms)}
                          </Body>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            </Surface>
          ) : null}
        </ScrollView>
      </DatabaseGate>

      <SymptomSearchModal
        visible={searchOpen}
        activeBook={selectedBook}
        activeBookName={activeBookName}
        selectedSymptoms={selectedSymptoms}
        onClose={() => setSearchOpen(false)}
        onToggleSymptom={toggleSymptom}
        searchSymptoms={searchSymptomsAsync}
        getSymptomsCount={getSymptomsCountAsync}
      />

      <ModalSheet
        visible={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Save case"
        description="Enter a case name before saving the current search."
        icon={<Ionicons name="bookmark-outline" size={20} color={colors.accentForeground} />}
      >
        <Input
          label="Case name"
          value={caseName}
          onChangeText={setCaseName}
          placeholder="e.g. Patient A symptoms"
          autoFocus
        />
        {saveError ? (
          <View style={{ marginBottom: space.lg }}>
            <Callout variant="destructive">{saveError}</Callout>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => setSaveOpen(false)}
            style={{ flex: 1 }}
          />
          <Button
            title={isSaving ? 'Saving…' : 'Save case'}
            onPress={saveCase}
            loading={isSaving}
            disabled={!caseName.trim()}
            style={{ flex: 2 }}
          />
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
