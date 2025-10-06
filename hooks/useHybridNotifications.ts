import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { registerGuestExpoPushToken } from '../utils/api';

// Global variable to store the current guest token for easy access
let currentGuestToken: string | null = null;

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface HybridNotificationState {
  isInitialized: boolean;
  pushToken: string | null;
  permissions: Notifications.NotificationPermissionsStatus | null;
  isGuestToken: boolean;
  error: string | null;
}

export interface HybridNotificationHandlers {
  sendTestNotification: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const GUEST_TOKEN_KEY = '@expo_push_token_guest';
const TOKEN_DEVICE_ID_KEY = '@expo_push_device_id';

export function useHybridNotifications(): HybridNotificationState & HybridNotificationHandlers {
  const [state, setState] = useState<HybridNotificationState>({
    isInitialized: false,
    pushToken: null,
    permissions: null,
    isGuestToken: true,
    error: null,
  });

  const { token, user } = useAuthStore();
  const isAuthenticated = !!token;
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    initializeNotifications();

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
      }
    );

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      subscription?.remove();
    };
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    if (isAuthenticated && user && state.pushToken && state.isGuestToken) {
      // User just logged in - update state to reflect that token is now linked
      // The actual linking is handled by the backend during login/registration
      setState(prev => ({
        ...prev,
        isGuestToken: false,
      }));
      
      // Clear the guest token from storage since it's now linked
      AsyncStorage.removeItem(GUEST_TOKEN_KEY);
      currentGuestToken = null;
      
    }
  }, [isAuthenticated, user, state.pushToken, state.isGuestToken]);

  const initializeNotifications = async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        throw new Error('Push notification permission not granted');
      }

      // Get the Expo push token
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found in app configuration');
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({ 
        projectId 
      });
      
      const token = tokenData.data;
      
      // Check if we have a stored device ID
      let deviceId = await AsyncStorage.getItem(TOKEN_DEVICE_ID_KEY);
      if (!deviceId) {
        // Generate a simple device ID based on platform and timestamp
        deviceId = `${Platform.OS}_${Date.now()}`;
        await AsyncStorage.setItem(TOKEN_DEVICE_ID_KEY, deviceId);
      }

      setState(prev => ({
        ...prev,
        pushToken: token,
        permissions: { 
          status: finalStatus,
          granted: finalStatus === 'granted',
          canAskAgain: true,
          expires: 'never'
        },
        isInitialized: true,
      }));

      // Register the token (as guest initially)
      await registerTokenAsGuest(token, deviceId);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        isInitialized: true,
      }));
    }
  };

  const registerTokenAsGuest = async (token: string, deviceId: string) => {
    try {
      
      const tokenData = {
        token,
        device_id: deviceId,
        platform: Platform.OS as 'ios' | 'android' | 'web',
      };

      const result = await registerGuestExpoPushToken(tokenData);
      
      if (result.success) {
        // Store the guest token for potential linking later
        await AsyncStorage.setItem(GUEST_TOKEN_KEY, token);
        currentGuestToken = token; // Update global variable
        
        setState(prev => ({
          ...prev,
          isGuestToken: true,
        }));
        
      }
    } catch (error) {
      // Don't update state error here - this is not critical
    }
  };


  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && state.pushToken) {
      // Refresh token when app becomes active
      refreshToken();
    }
  };

  const sendTestNotification = async () => {
    try {
      // Import BASE from api utils to ensure consistency
      const { BASE } = await import('../utils/api');
      
      const response = await fetch(`${BASE}/test-notification-guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
      } else {
      }
    } catch (error) {
    }
  };

  const refreshToken = async () => {
    if (!state.isInitialized) return;
    
    try {
      // Re-initialize to get a fresh token
      await initializeNotifications();
    } catch (error) {
    }
  };

  return {
    ...state,
    sendTestNotification,
    refreshToken,
  };
}

// Export function to get current guest token for use in login/registration
export function getCurrentGuestToken(): string | null {
  return currentGuestToken;
}
