/**
 * Utility functions for protecting features that require authentication
 */

import { useRouter } from 'expo-router';
import { useIsAuthenticated } from '../store/useAuthStore';

/**
 * Hook that provides authentication protection utilities
 */
export function useAuthProtection() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();

  /**
   * Execute a function only if user is authenticated
   * @param callback Function to execute if authenticated
   * @param redirectToLogin If true, redirects to login page if not authenticated
   */
  const requireAuth = (callback: () => void, redirectToLogin = false) => {
    if (isAuthenticated) {
      callback();
    } else if (redirectToLogin) {
      router.push('/login');
    }
  };

  /**
   * Check if user is authenticated
   */
  const checkAuth = () => isAuthenticated;

  return {
    requireAuth,
    checkAuth,
    isAuthenticated,
  };
}

/**
 * Higher-order component that wraps a component with authentication protection
 * This can be used to protect entire screens or components
 */
export function withAuthProtection<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectToLogin?: boolean;
    fallbackComponent?: React.ComponentType<P>;
  }
) {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated } = useAuthProtection();
    
    if (!isAuthenticated) {
      if (options?.fallbackComponent) {
        return <options.fallbackComponent {...props} />;
      }
      return null; // or a loading/error component
    }
    
    return <Component {...props} />;
  };
}

