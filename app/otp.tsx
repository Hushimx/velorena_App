import { Stack } from 'expo-router';
import React from 'react';
import OtpScreen from '../screens/OtpScreen';

export default function OtpRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OtpScreen />
    </>
  );
}
