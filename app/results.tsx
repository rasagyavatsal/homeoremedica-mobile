import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Surface } from '@/components/ui/Surface';
import { Body, Display, Eyebrow, Mono } from '@/components/ui/Type';
import { radius, space, useTheme, withAlpha } from '@/constants/theme';
import { formatRemedyDisplayName } from '@/lib/format';
import { useAppContext } from '@/context/AppContext';
import { useCasesStore } from '@/lib/stores/cases-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Symptom } from '@homeoremedica/shared';

type RemedyResult = { remedy: string; slug: string; matchedSymptoms: string[] };

function getMatchingSymptomsLabel(count: number) {
  const suffix = count === 1 ? '' : 's';
  return `${count} matching symptom${suffix}`;
}

const bookNames: Record<string, string> = {
  boericke: 'Boericke',
  clarke: 'Clarke',
  kent: 'Kent',
  allen: 'Allen',
};

export default function ResultsScreen() {
  const { colors } = useTheme();
  const { findRemediesAsync, selectedSymptoms, selectedBook, isDbReady } = useAppContext();
  const [results, setResults] = useState<RemedyResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [caseName, setCaseName] = useState('');

  const { addCase } = useCasesStore();
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const loadResults = async () => {
      if (!isDbReady) return;
      setIsLoading(true);
      try {
        const remedies = await findRemediesAsync();
        const sortedRemedies = [...remedies].sort((a, b) => {
          const countDiff = b.matchedSymptoms.length - a.matchedSymptoms.length;
          if (countDiff !== 0) return countDiff;
          return a.remedy.localeCompare(b.remedy);
        });
        setResults(sortedRemedies);
      } catch (error) {
        console.error('Error finding remedies:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadResults();
  }, [findRemediesAsync, isDbReady]);

  const handleSavePress = () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to save cases.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    setCaseName(`Case ${new Date().toLocaleDateString()}`);
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!caseName.trim()) {
      Alert.alert('Error', 'Please enter a name for the case.');
      return;
    }

    setIsSaving(true);
    try {
      const symptomObjects: Symptom[] = selectedSymptoms.map((s) => ({
        id: `rn-${s}`,
        name: s,
        books: [selectedBook],
      }));

      await addCase(caseName.trim(), symptomObjects, selectedBook);
      setShowSaveModal(false);
      Alert.alert('Success', 'Case saved successfully!', [
        { text: 'View cases', onPress: () => router.push('/cases') },
        { text: 'OK' },
      ]);
    } catch (error: any) {
      console.error('Save case error:', error);
      Alert.alert('Error', error.message || 'Failed to save case.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Mono style={{ marginTop: space.md }}>Finding remedies...</Mono>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      {user ? (
        <View style={{ padding: space.page, paddingBottom: 0 }}>
          <Button
            onPress={handleSavePress}
            variant="outline"
            disabled={isSaving}
            title="Save case"
            icon={<Ionicons name="bookmark-outline" size={18} color={colors.foreground} />}
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{ padding: space.page, gap: space.lg }}
        showsVerticalScrollIndicator={false}
      >
        {results.length > 0 ? (
          <>
            <View
              style={{
                flexDirection: 'row',
                gap: space.md,
                padding: space.lg,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: withAlpha(colors.tertiary, 0.35),
                borderLeftWidth: 3,
                borderLeftColor: colors.tertiary,
                backgroundColor: withAlpha(colors.tertiary, 0.06),
              }}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.tertiary} style={{ marginTop: 1 }} />
              <Body size="sm" tone="onSurfaceVariant" style={{ flex: 1 }}>
                These results are for reference only. Consult a qualified practitioner before treatment.
              </Body>
            </View>

            {results.map((result) => (
              <Surface key={`${result.remedy}-${result.slug}`}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: space.md,
                        padding: space.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: withAlpha(colors.border, 0.25),
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Display size="sm">{formatRemedyDisplayName(result.remedy)}</Display>
                        <Mono small tone="tertiary" style={{ marginTop: 3 }}>
                          {getMatchingSymptomsLabel(result.matchedSymptoms.length)}
                        </Mono>
                      </View>
                    </View>

                    <View style={{ padding: space.lg, gap: space.md }}>
                      <Eyebrow>Matched symptoms</Eyebrow>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                        {result.matchedSymptoms.map((symptom) => (
                          <View
                            key={symptom}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              maxWidth: '100%',
                              borderWidth: 1,
                              borderColor: withAlpha(colors.border, 0.35),
                              backgroundColor: colors.surfaceBright,
                              borderRadius: radius.sm,
                              paddingVertical: 5,
                              paddingHorizontal: 9,
                            }}
                          >
                            <Ionicons name="checkmark" size={13} color={colors.success} />
                            <Body size="sm" style={{ flexShrink: 1 }}>
                              {symptom}
                            </Body>
                          </View>
                        ))}
                      </View>
                    </View>
              </Surface>
            ))}
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 64, paddingHorizontal: space.xxl }}>
            <Ionicons name="search-outline" size={48} color={withAlpha(colors.foreground, 0.25)} />
            <Display size="sm" style={{ marginTop: space.lg }}>
              No remedies found
            </Display>
            <Body size="sm" tone="onSurfaceVariant" style={{ marginTop: space.sm, textAlign: 'center' }}>
              Nothing in {bookNames[selectedBook]} matches these symptoms. Try different symptoms or
              another source.
            </Body>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: withAlpha(colors.scrim, 0.55),
            justifyContent: 'center',
            padding: space.xxl,
          }}
        >
          <Surface style={{ padding: space.xxl }}>
            <Display size="md">Save case</Display>

            <Input
              label="Case name"
              value={caseName}
              onChangeText={setCaseName}
              placeholder="e.g. Patient A symptoms"
              autoFocus
              containerStyle={{ marginTop: space.xl }}
            />

            <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.sm }}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowSaveModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save"
                onPress={handleConfirmSave}
                loading={isSaving}
                style={{ flex: 2 }}
              />
            </View>
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
