import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
          fontSize: 22,
          color: colors.foreground,
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: withAlpha(colors.foreground, 0.55),
          borderTopWidth: 2,
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.mono,
          fontSize: 10,
          letterSpacing: 0.5,
          marginTop: 3,
        },
        tabBarButton: HapticTabButton,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HomeoRemedica',
          tabBarLabel: 'Find Remedy',
          tabBarIcon: SearchTabIcon,
          tabBarButtonTestID: 'tab-finder',
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'My Cases',
          tabBarLabel: 'Cases',
          tabBarIcon: CasesTabIcon,
          tabBarButtonTestID: 'tab-cases',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ProfileTabIcon,
          tabBarButtonTestID: 'tab-profile',
        }}
      />
    </Tabs>
  );
}
