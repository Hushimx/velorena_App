/**
 * Debug component for testing first-time user experience
 * This component can be temporarily added to any screen for testing
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { debugFirstTimeStatus, resetForTesting, simulateFirstTimeUser } from '../utils/debugFirstTime';

export default function FirstTimeDebugger() {
  const handleDebugStatus = async () => {
    const status = await debugFirstTimeStatus();
    Alert.alert(
      'First-time User Status',
      `Has completed: ${status.hasCompleted}\nIs first-time: ${status.isFirstTime}`,
      [{ text: 'OK' }]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset First-time Status',
      'This will make the app show the welcome screen again on next launch. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: resetForTesting
        }
      ]
    );
  };

  const handleSimulate = () => {
    Alert.alert(
      'Simulate First-time User',
      'This will reset the first-time status. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Simulate', 
          onPress: simulateFirstTimeUser
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>First-time User Debugger</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleDebugStatus}>
        <Text style={styles.buttonText}>Check Status</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
        <Text style={styles.buttonText}>Reset Status</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.simulateButton]} onPress={handleSimulate}>
        <Text style={styles.buttonText}>Simulate First-time</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  simulateButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
});
