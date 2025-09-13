import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BRAND_COLORS } from '../constants/Theme';
import { useHasHydrated, useIsAuthenticated } from '../store/useAuthStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isAuthenticated = useIsAuthenticated();
  const hasHydrated = useHasHydrated();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!hasHydrated) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inAuthPages = segments.includes('product') || 
                       segments.includes('cart') || 
                       segments.includes('checkout') ||
                       segments.includes('appointments') ||
                       segments.includes('appointment') ||
                       segments.includes('create-appointment') ||
                       segments.includes('calendar') ||
                       segments.includes('orders');

    if (!isAuthenticated && (inAuthGroup || inAuthPages)) {
      // User is not authenticated but trying to access protected routes
      router.replace('/login');
    } else if (isAuthenticated && (segments[0] === 'login' || segments[0] === 'signup')) {
      // User is authenticated but on login/signup pages
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, hasHydrated, router]);

  if (!hasHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.background.primary,
  },
});
