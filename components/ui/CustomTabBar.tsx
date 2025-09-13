import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCartStore } from '../../store/useCartStore';

// Colors updated to match the new design theme
const BAR_BACKGROUND = '#2a1e1e';
const INACTIVE_ICON = '#8B7355'; // muted brown for inactive icons
const ACTIVE_BACKGROUND = '#ffde9f';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;
  const { items } = useCartStore();
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [state.index, indicatorAnim]);

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
      {/* Creative Active Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            transform: [
              {
                translateX: indicatorAnim.interpolate({
                  inputRange: [0, 1, 2, 3],
                  outputRange: [0, 80, 160, 240], // 4 tabs: index, categories, cart, more
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      />
      
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
              showBadge={route.name === 'cart' && cartItemCount > 0}
              badgeCount={cartItemCount}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color: isFocused ? BAR_BACKGROUND : INACTIVE_ICON, size: 26 })
                : null}
            </ScaleButton>
          );
        })}
      </View>
    </Animated.View>
  );
}


function ScaleButton({ children, label, isFocused, onPress, onLongPress, showBadge, badgeCount }: {
  children: React.ReactNode;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  showBadge?: boolean;
  badgeCount?: number;
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;
  const focusAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isFocused, focusAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 0, useNativeDriver: true, speed: 60, bounciness: 6 }).start();
  };

  const scale = pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const iconScale = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

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
        style={[styles.button, isFocused && styles.activeButton]}
      >
        <View style={styles.iconContainer}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            {children}
          </Animated.View>
          {showBadge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badgeCount && badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, { color: isFocused ? '#2a1e1e' : INACTIVE_ICON }]} numberOfLines={1}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BAR_BACKGROUND,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.select({ ios: 24, android: 16, default: 16 }),
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
  },
  indicator: {
    position: 'absolute',
    top: 8,
    left: 16,
    height: 4,
    backgroundColor: ACTIVE_BACKGROUND,
    borderRadius: 2,
    width: 60, // Fixed width for cleaner look
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 16,
    minHeight: 60,
  },
  activeButton: {
    backgroundColor: ACTIVE_BACKGROUND,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: ACTIVE_BACKGROUND,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: 'NotoSansArabic_600SemiBold',
    textAlign: 'center',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BAR_BACKGROUND,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
  },
});