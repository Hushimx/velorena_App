/**
 * Simple test component for first-time user functionality
 * Add this temporarily to any screen to test
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { isFirstTimeUser, markFirstTimeCompleted, resetFirstTimeStatus } from '../utils/firstTimeUser';

export default function SimpleFirstTimeTest() {
  const [status, setStatus] = useState<string>('Unknown');

  const checkStatus = async () => {
    try {
      const isFirstTime = await isFirstTimeUser();
      setStatus(isFirstTime ? 'First Time User' : 'Returning User');
      Alert.alert('Status', isFirstTime ? 'First Time User' : 'Returning User');
    } catch (error) {
      Alert.alert('Error', 'Failed to check status');
    }
  };

  const markCompleted = async () => {
    try {
      await markFirstTimeCompleted();
      setStatus('Marked as completed');
      Alert.alert('Success', 'Welcome marked as seen');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as completed');
    }
  };

  const reset = async () => {
    try {
      await resetFirstTimeStatus();
      setStatus('Reset - will show welcome next time');
      Alert.alert('Reset', 'Status reset - welcome will show next time');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>First-time Test</Text>
      <Text style={styles.status}>Status: {status}</Text>
      
      <TouchableOpacity style={styles.button} onPress={checkStatus}>
        <Text style={styles.buttonText}>Check Status</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.markButton]} onPress={markCompleted}>
        <Text style={styles.buttonText}>Mark as Seen</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={reset}>
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  markButton: {
    backgroundColor: '#34C759',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
