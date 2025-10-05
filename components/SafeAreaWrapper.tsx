import React from 'react';
import { View, Platform, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  paddingTop?: number;
  paddingBottom?: number;
  statusBarStyle?: 'light-content' | 'dark-content' | 'default';
  statusBarTranslucent?: boolean;
}

/**
 * A wrapper component that handles SafeAreaView consistently across iOS and Android
 * 
 * FIXES:
 * - iOS: Prevents double padding issues and content being clipped from top
 * - Android: Proper status bar handling with SafeAreaView
 * 
 * USAGE:
 * <SafeAreaWrapper backgroundColor="#FFFFFF">
 *   <YourContent />
 * </SafeAreaWrapper>
 */
export default function SafeAreaWrapper({ 
  children, 
  style, 
  backgroundColor = '#ffffff',
  paddingTop,
  paddingBottom,
  statusBarStyle = 'dark-content',
  statusBarTranslucent = false
}: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets();

  // For Android, we need to handle the status bar properly
  if (Platform.OS === 'android') {
    return (
      <View style={{ flex: 1, backgroundColor }}>
        <StatusBar 
          backgroundColor={backgroundColor} 
          barStyle={statusBarStyle} 
          translucent={statusBarTranslucent}
        />
        <SafeAreaView style={{ flex: 1, backgroundColor, ...style }}>
          {children}
        </SafeAreaView>
      </View>
    );
  }

  // For iOS, use the custom padding approach to avoid double padding
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    paddingTop: paddingTop !== undefined 
      ? paddingTop 
      : insets.top,
    paddingBottom: paddingBottom !== undefined 
      ? paddingBottom 
      : insets.bottom,
    ...style,
  };

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
}
