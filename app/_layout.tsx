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
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../components/AuthProvider';
import { GlobalErrorOverlay } from '../components/GlobalErrorOverlay';
import { useHybridNotifications } from '../hooks/useHybridNotifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
    NotoSansArabic_800ExtraBold,
  });

  // Initialize hybrid notifications
  useHybridNotifications();

  // Handle notification that opened the app (when app was killed)
  useEffect(() => {
    const checkInitialNotification = async () => {
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) {
          console.log('📬 App opened from notification (killed state):', response);
          const data = response.notification.request.content.data;
          handleNotificationNavigation(data);
        }
      } catch (error) {
        console.error('Error checking initial notification:', error);
      }
    };

    checkInitialNotification();
  }, []);

  const handleNotificationNavigation = (data: any) => {
    if (!data) return;

    const { type, orderId, appointmentId, screen } = data;

    // Wait a bit for the app to fully initialize before navigating
    setTimeout(() => {
      if (screen) {
        router.push(screen as any);
      } else if (type === 'order' && orderId) {
        router.push(`/orders/${orderId}` as any);
      } else if (type === 'appointment' && appointmentId) {
        router.push(`/appointment/${appointmentId}` as any);
      }
    }, 1000);
  };

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
