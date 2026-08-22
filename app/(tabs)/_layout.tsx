import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup } from '@/components/BrandLockup';
import { fonts, sizes, space, useTheme, withAlpha } from '@/constants/theme';
import { withHaptic } from '@/lib/haptics';

type TabIconProps = Readonly<{ color: string; focused: boolean }>;

function HapticTabButton(props: any) {
  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.7}
      onPress={props.onPress ? withHaptic(props.onPress) : undefined}
    />
  );
}

function ChatTabIcon({ color, focused }: TabIconProps) {
  return <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={color} />;
}

function HistoryTabIcon({ color, focused }: TabIconProps) {
  return <Ionicons name={focused ? 'time' : 'time-outline'} size={22} color={color} />;
}

function AccountTabIcon({ color, focused }: TabIconProps) {
  return <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <BrandLockup />,
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: withAlpha(colors.border, 0.42),
          borderTopWidth: 1,
          height: sizes.tabBar + insets.bottom,
          paddingBottom: insets.bottom + space.sm,
          paddingTop: space.sm,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.body,
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarButton: HapticTabButton,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ChatTabIcon,
          tabBarButtonTestID: 'tab-chat',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: HistoryTabIcon,
          tabBarButtonTestID: 'tab-history',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarLabel: 'Account',
          tabBarIcon: AccountTabIcon,
          tabBarButtonTestID: 'tab-account',
        }}
      />
    </Tabs>
  );
}
