import { FontAwesome6 } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Colors kept consistent with the app
const BAR_YELLOW = '#F4D03F';
const ACTIVE_ICON = '#1e40af'; // blue active color
const INACTIVE_ICON = '#4B5563'; // gray inactive color

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }],
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            if (!isFocused) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <ScaleButton
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              isFocused={isFocused}
              label={String(label)}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color: isFocused ? ACTIVE_ICON : INACTIVE_ICON, size: 26 })
                : null}
            </ScaleButton>
          );
        })}

        {/* Static icons when corresponding routes are not present */}
        {(!state.routes.find(r => r.name === 'settings')) && (
          <ScaleButton
            key="static-settings"
            onPress={() => {}}
            onLongPress={() => {}}
            isFocused={false}
            label="الاعدادات"
          >
            <FontAwesome6 name="gear" size={26} color={INACTIVE_ICON} />
          </ScaleButton>
        )}
        {(!state.routes.find(r => r.name === 'support')) && (
          <ScaleButton
            key="static-support"
            onPress={() => {}}
            onLongPress={() => {}}
            isFocused={false}
            label="الدعم"
          >
            <FontAwesome6 name="headset" size={26} color={INACTIVE_ICON} />
          </ScaleButton>
        )}
      </View>
    </Animated.View>
  );
}

function ScaleButton({ children, label, isFocused, onPress, onLongPress }: {
  children: React.ReactNode;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 0, useNativeDriver: true, speed: 60, bounciness: 6 }).start();
  };

  const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });

  return (
    <Animated.View style={[styles.item, { transform: [{ scale }] }]}> 
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        style={styles.button}
      >
        <View>{children}</View>
        <Text style={[styles.label, { color: isFocused ? ACTIVE_ICON : INACTIVE_ICON }]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BAR_YELLOW,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.select({ ios: 18, android: 12, default: 12 }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 10,
  },
  label: {
    fontSize: 11,
    fontFamily: 'NotoSansArabic_700Bold',
  },
});


