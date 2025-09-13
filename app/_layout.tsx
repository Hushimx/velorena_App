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
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '../components/AuthProvider';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
    NotoSansArabic_800ExtraBold,
  });

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
              <Stack>
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="search" options={{ headerShown: false }} />
              <Stack.Screen name="product/[id]" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="cart" options={{ headerShown: false }} />
              <Stack.Screen name="checkout" options={{ headerShown: false }} />
              <Stack.Screen name="appointments" options={{ headerShown: false }} />
              <Stack.Screen name="designs" options={{ headerShown: false }} />
              <Stack.Screen name="photo-editor" options={{ headerShown: false }} />
              <Stack.Screen name="appointment/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="create-appointment" options={{ headerShown: false }} />
              <Stack.Screen name="calendar" options={{ headerShown: false }} />
              <Stack.Screen name="orders/index" options={{ headerShown: false }} />
              <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
              </Stack>
            </AuthProvider>
            <StatusBar style="auto" />
          </ThemeProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
