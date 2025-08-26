import { FontAwesome6 } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Colors updated to match the new design theme
const BAR_BACKGROUND = '#2a1e1e';
const ACTIVE_ICON = '#ffde9f'; // warm yellow for active icons
const INACTIVE_ICON = '#8B7355'; // muted brown for inactive icons
const ACTIVE_BACKGROUND = '#ffde9f';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [state.index, slideAnim]);

  // Count only the routes that are actually navigable (not hidden)
  const activeTabCount = state.routes.filter(route => {
    // Skip routes that are hidden or disabled
    return route.name !== 'settings' && route.name !== 'support';
  }).length;

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
             {/* Sliding indicator - only show when there are multiple tabs */}
       {activeTabCount > 1 && (
         <Animated.View
           style={[
             styles.indicator,
             {
               transform: [
                 {
                   translateX: slideAnim.interpolate({
                     inputRange: [0, 1], // Only 2 active tabs (index and explore)
                     outputRange: [0, 80], // Move 80px for the second tab
                     extrapolate: 'clamp',
                   }),
                 },
               ],
             },
           ]}
         />
       )}
      
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

          // Add center home button after first tab
          if (index === 0) {
            return (
              <React.Fragment key={`${route.key}-fragment`}>
                <ScaleButton
                  key={route.key}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  isFocused={isFocused}
                  label={String(label)}
                >
                  {options.tabBarIcon
                    ? options.tabBarIcon({ focused: isFocused, color: isFocused ? BAR_BACKGROUND : INACTIVE_ICON, size: 26 })
                    : null}
                </ScaleButton>
                
                {/* Center Dynamic Button */}
                <FloatingHomeButton 
                  key="center-home"
                  onPress={() => navigation.navigate('index')}
                  currentIndex={state.index}
                  routes={state.routes}
                  descriptors={descriptors}
                />
              </React.Fragment>
            );
          }

          return (
            <ScaleButton
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              isFocused={isFocused}
              label={String(label)}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color: isFocused ? BAR_BACKGROUND : INACTIVE_ICON, size: 26 })
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

function FloatingHomeButton({ 
  onPress, 
  currentIndex, 
  routes, 
  descriptors 
}: { 
  onPress: () => void;
  currentIndex: number;
  routes: any[];
  descriptors: any;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconScaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  // Animate icon change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(iconScaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(iconScaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex, iconScaleAnim]);

  // Get current tab icon
  const getCurrentTabIcon = () => {
    if (currentIndex < routes.length) {
      const currentRoute = routes[currentIndex];
      const options = descriptors[currentRoute.key]?.options;
      
      // Return the icon based on current tab
      switch (currentRoute.name) {
        case 'index':
          return 'house';
        case 'explore':
          return 'bell';
        case 'settings':
          return 'gear';
        case 'support':
          return 'headset';
        default:
          return 'house';
      }
    }
    return 'house';
  };

  return (
    <Animated.View
      style={[
        styles.floatingButtonContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.floatingButtonInner}>
          <Animated.View style={{ transform: [{ scale: iconScaleAnim }] }}>
            <FontAwesome6 
              name={getCurrentTabIcon() as any} 
              size={26} 
              color={BAR_BACKGROUND} 
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
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
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          {children}
        </Animated.View>
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
    right: 16,
    height: 4,
    backgroundColor: ACTIVE_BACKGROUND,
    borderRadius: 2,
    width: '25%',
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
  floatingButtonContainer: {
    position: 'absolute',
    top: -35,
    alignSelf: 'center',
    zIndex: 10,
  },
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACTIVE_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACTIVE_BACKGROUND,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 1,
    borderColor: BAR_BACKGROUND,
  },
  floatingButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});


