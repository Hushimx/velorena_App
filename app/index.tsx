import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useHasHydrated, useIsAuthenticated } from '../store/useAuthStore';
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
        setIsFirstTime(firstTime);
      } catch (error) {
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


    // Small delay to allow smooth transition
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // User is logged in, go to main app
        router.replace('/(tabs)');
      } else if (isFirstTime) {
        // First-time user, show welcome screen
        router.replace('/welcome');
      } else {
        // Returning user who is not logged in, go directly to main app
        router.replace('/(tabs)');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, hasHydrated, isFirstTime, isCheckingFirstTime, router]);

  return null;
}

