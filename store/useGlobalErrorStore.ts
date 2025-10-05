import { create } from 'zustand';

interface GlobalErrorState {
  isServerDown: boolean;
  errorMessage: string | null;
  lastErrorTime: number | null;
  setServerDown: (isDown: boolean, message?: string) => void;
  clearError: () => void;
  isNetworkError: (error: any) => boolean;
}

export const useGlobalErrorStore = create<GlobalErrorState>((set, get) => ({
  isServerDown: false,
  errorMessage: null,
  lastErrorTime: null,

  setServerDown: (isDown: boolean, message?: string) => {
    set({
      isServerDown: isDown,
      errorMessage: message || 'الخادم غير متاح حالياً. يرجى المحاولة لاحقاً.',
      lastErrorTime: isDown ? Date.now() : null,
    });
  },

  clearError: () => {
    set({
      isServerDown: false,
      errorMessage: null,
      lastErrorTime: null,
    });
  },

  isNetworkError: (error: any) => {
    if (!error) return false;
    
    // Check for network-related errors
    const networkErrorPatterns = [
      'Network request failed',
      'fetch',
      'timeout',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'Network error',
      'Server is not responding',
      'Connection refused',
      'Unable to connect',
    ];

    const errorMessage = error.message || error.toString() || '';
    const errorString = errorMessage.toLowerCase();

    return networkErrorPatterns.some(pattern => 
      errorString.includes(pattern.toLowerCase())
    ) || error.status === 0 || error.code === 'NETWORK_ERROR';
  },
}));
