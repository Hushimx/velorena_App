// Debug script to test notification configuration
// Run this in your app's console to debug notification issues

console.log('🔍 DEBUGGING NOTIFICATION CONFIGURATION');
console.log('=====================================');

// Check if we're in a development environment
console.log('Development mode:', __DEV__);

// Check device information
console.log('Device isDevice:', Device.isDevice);
console.log('Device model:', Device.modelName);
console.log('Device OS version:', Device.osVersion);
console.log('Platform:', Platform.OS);

// Check Expo project configuration
console.log('Expo project ID:', process.env.EXPO_PROJECT_ID || 'Not set');
console.log('Expo public API URL:', process.env.EXPO_PUBLIC_API_URL || 'Not set');

// Test notification permissions
Notifications.getPermissionsAsync().then(permissions => {
  console.log('Current permissions:', permissions);
});

// Test push token generation
console.log('Attempting to generate push token...');
Notifications.getExpoPushTokenAsync()
  .then(token => {
    console.log('✅ Push token generated successfully!');
    console.log('Token:', token.data);
    console.log('Token length:', token.data.length);
    console.log('Token starts with:', token.data.substring(0, 20));
    
    // Validate token format
    if (token.data.startsWith('ExponentPushToken[')) {
      console.log('✅ Valid Expo push token format!');
    } else {
      console.log('❌ Invalid token format - this is the problem!');
    }
  })
  .catch(error => {
    console.error('❌ Push token generation failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  });

console.log('=====================================');
console.log('If you see "Invalid token format" or an error, that explains why backend notifications don\'t work.');
console.log('The app is generating "local-only" instead of real Expo push tokens.');


