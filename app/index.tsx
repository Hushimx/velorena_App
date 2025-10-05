import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useIsAuthenticated, useHasHydrated } from '../store/useAuthStore';
import { isFirstTimeUser } from '../utils/firstTimeUser';

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const hasHydrated = useHasHydrated();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [isCheckingFirstTime, setIsCheckingFirstTime] = useState(false);

  useEffect(() => {
    // Wait for auth state to hydrate
    if (!hasHydrated || isCheckingFirstTime) return;

    const checkFirstTime = async () => {
      setIsCheckingFirstTime(true);
      try {
        const firstTime = await isFirstTimeUser();
        console.log('🔍 First-time user check result:', firstTime);
        setIsFirstTime(firstTime);
      } catch (error) {
        console.error('❌ Error checking first-time user status:', error);
        // If there's an error, assume it's not the first time
        setIsFirstTime(false);
      } finally {
        setIsCheckingFirstTime(false);
      }
    };

    checkFirstTime();
  }, [hasHydrated, isCheckingFirstTime]);

  useEffect(() => {
    // Wait for both auth state and first-time status to be determined
    if (!hasHydrated || isFirstTime === null || isCheckingFirstTime) return;

    console.log('🚀 Navigation decision:', { isAuthenticated, isFirstTime });

    // Small delay to allow smooth transition
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // User is logged in, go to main app
        console.log('📱 User is authenticated, going to main app');
        router.replace('/(tabs)');
      } else if (isFirstTime) {
        // First-time user, show welcome screen
        console.log('👋 First-time user, showing welcome');
        router.replace('/welcome');
      } else {
        // Returning user who is not logged in, go directly to main app
        console.log('🔄 Returning user, going to main app');
        router.replace('/(tabs)');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, hasHydrated, isFirstTime, isCheckingFirstTime, router]);

  return null;
}

