import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { fonts, ThemeProvider, useTheme } from '@/constants/theme';
import { AppProvider } from '@/context/AppContext';
import { withHaptic } from '@/lib/haptics';
import { useAuthStore } from '@/lib/stores/auth-store';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function BackHomeHeaderButton() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={withHaptic(() => router.replace('/'))}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={{ marginLeft: 4 }}
    >
      <Ionicons name="arrow-back" size={24} color={colors.foreground} />
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const { initializeAuthListener } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'fade',
          headerTitleAlign: 'left',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: {
            fontFamily: fonts.display,
            fontSize: 20,
            fontWeight: '500',
            color: colors.foreground,
          },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="select-book"
          options={{ title: 'Select source', presentation: 'modal' }}
        />
        <Stack.Screen
          name="auth/login"
          options={{ title: '', headerLeft: BackHomeHeaderButton }}
        />
        <Stack.Screen
          name="auth/signup"
          options={{ title: '', headerLeft: BackHomeHeaderButton }}
        />
        <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="auth/change-password" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
