import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Surface } from '@/components/ui/Surface';
import { Body, Display, Mono } from '@/components/ui/Type';
import { radius, space, useTheme, withAlpha } from '@/constants/theme';
import { useCasesStore } from '@/lib/stores/cases-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAppContext } from '@/context/AppContext';
import { withHaptic } from '@/lib/haptics';
import { Case } from '@homeoremedica/shared';

export default function CasesScreen() {
  const { colors } = useTheme();
  const { cases, loading, error, loadUserCases, deleteCase } = useCasesStore();
  const { user } = useAuthStore();
  const { setSelectedSymptoms, setSelectedBook } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadUserCases();
    } else {
      router.push('/auth/login');
    }
  }, [user]);

  const handleLoadCase = (caseItem: Case) => {
    Alert.alert(
      'Load case',
      `Would you like to load symptoms from "${caseItem.name}"? This will replace your current selection.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: () => {
            if (caseItem.bookId) setSelectedBook(caseItem.bookId);
            setSelectedSymptoms(caseItem.selectedSymptoms.map((s) => s.name));
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleDelete = (caseId: string) => {
    Alert.alert('Delete case', 'Are you sure you want to delete this case?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCase(caseId) },
    ]);
  };

  const renderCaseItem = ({ item }: { item: Case }) => (
    <Surface style={{ flexDirection: 'row', overflow: 'hidden', marginBottom: space.md }}>
      <Pressable
        style={{ flex: 1, padding: space.lg }}
        onPress={withHaptic(() => handleLoadCase(item))}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.selectedSymptoms.length} symptoms`}
      >
        <Display size="sm">{item.name}</Display>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Mono small>{new Date(item.timestamp).toLocaleDateString()}</Mono>
          <Mono small tone="onSurfaceVariant">·</Mono>
          <Mono small>{item.selectedSymptoms.length} symptoms</Mono>
        </View>
        {item.bookId ? (
          <View
            style={{
              alignSelf: 'flex-start',
              marginTop: 10,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: withAlpha(colors.primary, 0.35),
              backgroundColor: withAlpha(colors.primary, 0.1),
            }}
          >
            <Mono small tone="primary">
              {item.bookId.charAt(0).toUpperCase() + item.bookId.slice(1)}
            </Mono>
          </View>
        ) : null}
      </Pressable>

      <TouchableOpacity
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: space.lg,
          borderLeftWidth: 1,
          borderLeftColor: withAlpha(colors.border, 0.3),
        }}
        onPress={withHaptic(() => handleDelete(item.id))}
        accessibilityRole="button"
        accessibilityLabel="Delete case"
      >
        <Ionicons name="trash-outline" size={20} color={colors.destructive} />
      </TouchableOpacity>
    </Surface>
  );

  if (!user) return null;

  let content: React.ReactNode;

  if (error) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.destructive} />
        <Display size="sm" style={{ marginTop: space.lg, textAlign: 'center' }}>
          Something went wrong
        </Display>
        <Body size="sm" tone="onSurfaceVariant" style={{ marginTop: space.sm, marginBottom: space.xl, textAlign: 'center' }}>
          {error}
        </Body>
        <Button title="Try again" onPress={loadUserCases} style={{ minWidth: 180 }} />
      </View>
    );
  } else if (loading && cases.length === 0) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Mono style={{ marginTop: space.md }}>Loading your cases...</Mono>
      </View>
    );
  } else if (cases.length === 0) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Ionicons name="file-tray-outline" size={56} color={withAlpha(colors.foreground, 0.25)} />
        <Display size="sm" style={{ marginTop: space.lg }}>
          No saved cases
        </Display>
        <Body size="sm" tone="onSurfaceVariant" style={{ marginTop: space.sm, marginBottom: space.xl, textAlign: 'center' }}>
          Save a search to keep it here.
        </Body>
        <Button
          title="Start searching"
          onPress={() => router.replace('/')}
          style={{ minWidth: 180 }}
        />
      </View>
    );
  } else {
    content = (
      <FlatList
        data={cases}
        renderItem={renderCaseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: space.page }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadUserCases}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    );
  }

  return <View style={{ flex: 1, backgroundColor: colors.background }}>{content}</View>;
}
