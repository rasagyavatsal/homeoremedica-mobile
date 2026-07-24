import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup } from '@/components/BrandLockup';
import { ThemeToggle } from '@/components/ThemeToggle';
import { fonts, useTheme, withAlpha } from '@/constants/theme';
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

function SearchTabIcon({ color, focused }: TabIconProps) {
  return <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />;
}

function CasesTabIcon({ color, focused }: TabIconProps) {
  return <Ionicons name={focused ? 'file-tray-full' : 'file-tray-outline'} size={22} color={color} />;
}

function ProfileTabIcon({ color, focused }: TabIconProps) {
  return <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'left',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontFamily: fonts.display,
          fontSize: 20,
          fontWeight: '500',
          color: colors.foreground,
        },
        headerRight: () => <ThemeToggle />,
        headerRightContainerStyle: { paddingRight: 16 },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: withAlpha(colors.border, 0.42),
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
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
          headerTitle: () => <BrandLockup />,
          tabBarLabel: 'Find Remedy',
          tabBarIcon: SearchTabIcon,
          tabBarButtonTestID: 'tab-finder',
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Saved cases',
          tabBarLabel: 'Cases',
          tabBarIcon: CasesTabIcon,
          tabBarButtonTestID: 'tab-cases',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarLabel: 'Profile',
          tabBarIcon: ProfileTabIcon,
          tabBarButtonTestID: 'tab-profile',
        }}
      />
    </Tabs>
  );
}
