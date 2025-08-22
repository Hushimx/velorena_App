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

interface OtpState {
  otpId: string | null;
  isOtpVerified: boolean;
  otpIdentifier: string | null;
  otpType: 'email' | 'sms' | 'whatsapp' | null;
  otpExpiresAt: string | null;
}

interface AuthState extends OtpState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setOtpData: (otpId: string, identifier: string, type: 'email' | 'sms' | 'whatsapp', expiresAt?: string) => void;
  setOtpVerified: (verified: boolean) => void;
  clearOtpData: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      
      // OTP state
      otpId: null,
      isOtpVerified: false,
      otpIdentifier: null,
      otpType: null,
      otpExpiresAt: null,
      
      login: (user: User, token: string) => {
        set({ user, token, isLoading: false });
      },
      
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isLoading: false,
          // Clear OTP data on logout
          otpId: null,
          isOtpVerified: false,
          otpIdentifier: null,
          otpType: null,
          otpExpiresAt: null,
        });
      },
      
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setOtpData: (otpId: string, identifier: string, type: 'email' | 'sms' | 'whatsapp', expiresAt?: string) => {
        set({ 
          otpId, 
          otpIdentifier: identifier, 
          otpType: type,
          otpExpiresAt: expiresAt || null,
          isOtpVerified: false 
        });
      },

      setOtpVerified: (verified: boolean) => {
        set({ isOtpVerified: verified });
      },

      clearOtpData: () => {
        set({ 
          otpId: null,
          isOtpVerified: false,
          otpIdentifier: null,
          otpType: null,
          otpExpiresAt: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user, token, and OTP verification status
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isOtpVerified: state.isOtpVerified,
        otpId: state.otpId,
      }),
    }
  )
);

// Selector hooks for convenience
export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.token);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

// OTP selector hooks
export const useOtpId = () => useAuthStore((state) => state.otpId);
export const useIsOtpVerified = () => useAuthStore((state) => state.isOtpVerified);
export const useOtpData = () => useAuthStore((state) => ({
  otpId: state.otpId,
  isOtpVerified: state.isOtpVerified,
  otpIdentifier: state.otpIdentifier,
  otpType: state.otpType,
  otpExpiresAt: state.otpExpiresAt,
}));
