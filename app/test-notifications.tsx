import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHybridNotifications } from '../hooks/useHybridNotifications';
import { useAuthStore } from '../store/useAuthStore';

export default function TestNotificationsScreen() {
  const { 
    isInitialized, 
    pushToken, 
    isGuestToken, 
    error, 
    sendTestNotification,
    refreshToken 
  } = useHybridNotifications();
  
  const { token, user } = useAuthStore();
  const isAuthenticated = !!token;

  const handleSendTest = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Success', 'Test notification sent!');
    } catch {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleRefreshToken = async () => {
    try {
      await refreshToken();
      Alert.alert('Success', 'Token refreshed!');
    } catch {
      Alert.alert('Error', 'Failed to refresh token');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Push Notification Test</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, { color: isInitialized ? '#4CAF50' : '#FF9800' }]}>
            {isInitialized ? 'Initialized' : 'Initializing...'}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Authentication:</Text>
          <Text style={[styles.statusValue, { color: isAuthenticated ? '#4CAF50' : '#FF9800' }]}>
            {isAuthenticated ? `Logged in as ${user?.email}` : 'Guest User'}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Token Type:</Text>
          <Text style={[styles.statusValue, { color: isGuestToken ? '#FF9800' : '#4CAF50' }]}>
            {isGuestToken ? 'Guest Token' : 'User Token'}
          </Text>
        </View>

        {pushToken && (
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>Push Token:</Text>
            <Text style={styles.tokenValue} numberOfLines={2}>
              {pushToken}
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorLabel}>Error:</Text>
            <Text style={styles.errorValue}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.testButton]} 
            onPress={handleSendTest}
            disabled={!isInitialized}
          >
            <Text style={styles.buttonText}>Send Test Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.refreshButton]} 
            onPress={handleRefreshToken}
            disabled={!isInitialized}
          >
            <Text style={styles.buttonText}>Refresh Token</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            1. When you first open the app, a guest token is registered
          </Text>
          <Text style={styles.infoText}>
            2. If you log in, the guest token gets linked to your account
          </Text>
          <Text style={styles.infoText}>
            3. You can receive notifications both as guest and authenticated user
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  tokenContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tokenLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  errorContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorValue: {
    fontSize: 14,
    color: '#d32f2f',
  },
  buttonContainer: {
    marginTop: 30,
    gap: 15,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#4CAF50',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 5,
    lineHeight: 20,
  },
});
