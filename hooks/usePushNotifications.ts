import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    // Create notification channel for Android
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

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
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      throw new Error('Project ID not found in app configuration');
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ 
      projectId 
    });
    
    token = tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    throw error;
  }

  return token;
}

export function addNotificationListeners() {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
  });

  // Listener for when user taps on a notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('User tapped notification:', response);
    // You can add navigation logic here based on notification data
    const data = response.notification.request.content.data;
    console.log('Notification data:', data);
  });

  return {
    notificationListener,
    responseListener,
  };
}

export function removeNotificationListeners(listeners: {
  notificationListener: Notifications.Subscription;
  responseListener: Notifications.Subscription;
}) {
  listeners.notificationListener.remove();
  listeners.responseListener.remove();
}
