import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useIsAuthenticated } from '../store/useAuthStore';

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    // Small delay to allow auth state to rehydrate
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return null;
}

