/**
 * Debug utilities for first-time user experience
 * These functions help with testing and debugging the first-time user flow
 */

import { resetFirstTimeStatus, hasCompletedFirstTime, isFirstTimeUser } from './firstTimeUser';

/**
 * Debug function to check current first-time user status
 * Call this in your app to see the current state
 */
export const debugFirstTimeStatus = async () => {
  try {
    const hasCompleted = await hasCompletedFirstTime();
    const isFirstTime = await isFirstTimeUser();
    
    console.log('🔍 First-time user debug info:');
    console.log('  - Has completed first-time:', hasCompleted);
    console.log('  - Is first-time user:', isFirstTime);
    
    return { hasCompleted, isFirstTime };
  } catch (error) {
    console.error('❌ Error debugging first-time status:', error);
    return { hasCompleted: false, isFirstTime: false };
  }
};

/**
 * Reset first-time status for testing
 * This will make the app show the welcome screen again on next launch
 */
export const resetForTesting = async () => {
  try {
    await resetFirstTimeStatus();
    console.log('🔄 First-time status reset for testing');
    console.log('   The app will now show the welcome screen on next launch');
  } catch (error) {
    console.error('❌ Error resetting first-time status:', error);
  }
};

/**
 * Simulate a first-time user experience
 * This is useful for testing the welcome flow
 */
export const simulateFirstTimeUser = async () => {
  try {
    await resetFirstTimeStatus();
    console.log('🎭 Simulated first-time user experience');
    console.log('   Restart the app to see the welcome screen');
  } catch (error) {
    console.error('❌ Error simulating first-time user:', error);
  }
};
