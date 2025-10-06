/**
 * Simple first-time user tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_TIME_KEY = 'has_seen_welcome';

/**
 * Check if this is the user's first time using the app
 */
export const isFirstTimeUser = async (): Promise<boolean> => {
  try {
    const hasSeenWelcome = await AsyncStorage.getItem(FIRST_TIME_KEY);
    const isFirstTime = hasSeenWelcome !== 'true';
    return isFirstTime;
  } catch (error) {
    // If error, assume it's first time to be safe
    return true;
  }
};

/**
 * Mark that the user has seen the welcome screen
 */
export const markFirstTimeCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(FIRST_TIME_KEY, 'true');
  } catch (error) {
  }
};

/**
 * Reset for testing (remove this in production)
 */
export const resetFirstTimeStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FIRST_TIME_KEY);
  } catch (error) {
  }
};
