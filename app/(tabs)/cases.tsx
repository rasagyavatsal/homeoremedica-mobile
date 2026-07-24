import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Surface } from '@/components/ui/Surface';
import { Body, Display, Eyebrow, Mono } from '@/components/ui/Type';
import { radius, space, useTheme, withAlpha } from '@/constants/theme';
import { getSourceBookName } from '@/constants/books';
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
  }, [loadUserCases, router, user]);

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
    <Surface
      elevated={false}
      radius="lg"
      tone="bright"
      style={{ position: 'relative', overflow: 'hidden', marginBottom: space.md }}
    >
      <Pressable
        style={({ pressed }) => ({
          padding: space.lg,
          paddingRight: 56,
          backgroundColor: pressed ? colors.accent : 'transparent',
        })}
        onPress={withHaptic(() => handleLoadCase(item))}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.selectedSymptoms.length} symptoms`}
      >
        <Body style={{ fontWeight: '500' }}>{item.name}</Body>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
          }}
        >
          <Eyebrow>{new Date(item.timestamp).toLocaleDateString()}</Eyebrow>
          <Eyebrow>·</Eyebrow>
          <Eyebrow>
            {item.bookId ? getSourceBookName(item.bookId) : 'All sources'}
          </Eyebrow>
          <Eyebrow>·</Eyebrow>
          <Eyebrow>{item.selectedSymptoms.length} symptoms</Eyebrow>
        </View>
      </Pressable>

      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 8,
          top: 8,
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.md,
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
        <Ionicons name="cloud-offline-outline" size={44} color={colors.destructive} />
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
        <Ionicons name="file-tray-outline" size={44} color={colors.onSurfaceVariant} />
        <Display size="sm" style={{ marginTop: space.lg }}>
          No saved cases
        </Display>
        <View style={{ width: '100%', marginTop: space.lg, marginBottom: space.xl }}>
          <Callout>No saved cases yet. Create one after running a search.</Callout>
        </View>
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
        contentContainerStyle={{ padding: space.page, paddingTop: space.xl }}
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
