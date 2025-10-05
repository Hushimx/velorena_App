import {
  NotoSansArabic_400Regular,
  NotoSansArabic_500Medium,
  NotoSansArabic_600SemiBold,
  NotoSansArabic_700Bold,
  NotoSansArabic_800ExtraBold,
} from '@expo-google-fonts/noto-sans-arabic';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Easing } from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../components/AuthProvider';
import { GlobalErrorOverlay } from '../components/GlobalErrorOverlay';
import { useHybridNotifications } from '../hooks/useHybridNotifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
    NotoSansArabic_800ExtraBold,
  });

  // Initialize hybrid notifications
  useHybridNotifications();

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  // Set global defaults once fonts are loaded
  if (loaded) {
    const TextAny = RNText as any;
    const TextInputAny = RNTextInput as any;
    if (!TextAny.defaultProps || !TextAny.defaultProps.style) {
      TextAny.defaultProps = TextAny.defaultProps || {};
      TextAny.defaultProps.style = [{ fontFamily: 'NotoSansArabic_400Regular' }];
    }
    if (!TextInputAny.defaultProps || !TextInputAny.defaultProps.style) {
      TextInputAny.defaultProps = TextInputAny.defaultProps || {};
      TextInputAny.defaultProps.style = [{ fontFamily: 'NotoSansArabic_400Regular' }];
    }
  }

  // Custom animation configuration for smoother transitions
  const screenOptions = {
    headerShown: false,
    animation: 'slide_from_right' as const,
    animationDuration: 350, // Slower than default (300ms)
    animationTypeForReplace: 'push' as const,
    gestureEnabled: true,
    gestureDirection: 'horizontal' as const,
    transitionSpec: {
      open: {
        animation: 'timing' as const,
        config: {
          duration: 350,
          easing: Easing.out(Easing.poly(4)), // Smooth easing curve
        },
      },
      close: {
        animation: 'timing' as const,
        config: {
          duration: 300,
          easing: Easing.in(Easing.poly(4)), // Smooth easing curve
        },
      },
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
              <Stack screenOptions={screenOptions}>
                <Stack.Screen name="welcome" options={{ 
                  headerShown: false,
                  animation: 'fade',
                  animationDuration: 400
                }} />
              <Stack.Screen name="login" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="signup" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="(tabs)" options={{ 
                headerShown: false,
                animation: 'fade',
                animationDuration: 300
              }} />
              <Stack.Screen name="search" options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                animationDuration: 350
              }} />
              <Stack.Screen name="product/[id]" options={{ 
                headerShown: false, 
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="cart" options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                animationDuration: 350
              }} />
              <Stack.Screen name="checkout" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="appointments" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="designs" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="photo-editor" options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                animationDuration: 400
              }} />
              <Stack.Screen name="appointment/[id]" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="create-appointment" options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                animationDuration: 400
              }} />
              <Stack.Screen name="calendar" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="orders/index" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="orders/[id]" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="support" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="support/new-ticket" options={{ 
                headerShown: false,
                animation: 'slide_from_bottom',
                animationDuration: 400
              }} />
              <Stack.Screen name="support/ticket/[id]" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="addresses" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="account-settings" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="privacy" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="terms" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="test-notifications" options={{ 
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 350
              }} />
              <Stack.Screen name="+not-found" />
              </Stack>
            </AuthProvider>
            <GlobalErrorOverlay />
            <StatusBar style="auto" />
          </ThemeProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
