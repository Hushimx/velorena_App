import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  client_type: 'individual' | 'company';
  address?: string;
  city?: string;
  country?: string;
  // Add any other user fields returned by your API
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      hasHydrated: false,
      
      login: (user: User, token: string) => {
        set({ user, token, isLoading: false });
      },
      
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isLoading: false,
        });
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setHasHydrated: (hasHydrated: boolean) => {
        set({ hasHydrated });
      },

      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user and token
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selector hooks for convenience
export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.token);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useHasHydrated = () => useAuthStore((state) => state.hasHydrated);
