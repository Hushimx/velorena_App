import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface AnimatedDotsProps {
  count: number;
  activeIndex: number;
  dotColor?: string;
  activeDotColor?: string;
  dotSize?: number;
  activeDotSize?: number;
  duration?: number;
  gap?: number;
  style?: ViewStyle;
}

export default function AnimatedDots({
  count,
  activeIndex,
  dotColor = 'rgba(42, 30, 30, 0.2)',
  activeDotColor = '#2a1e1e',
  dotSize = 8,
  activeDotSize = 24,
  duration = 300,
  gap = 6,
  style,
}: AnimatedDotsProps) {
  // Initialize animations with proper initial values
  const dotAnimations = useRef<Animated.Value[]>(
    Array.from({ length: count }, (_, i) => new Animated.Value(i === activeIndex ? 1 : 0))
  ).current;

  // Update animations array if count changes
  useEffect(() => {
    // Add new animations if count increased
    while (dotAnimations.length < count) {
      const currentIndex = dotAnimations.length;
      const initialValue = currentIndex === activeIndex ? 1 : 0;
      dotAnimations.push(new Animated.Value(initialValue));
    }
    
    // Remove extra animations if count decreased
    if (dotAnimations.length > count) {
      dotAnimations.splice(count);
    }
  }, [count, activeIndex, dotAnimations]);

  // Animate when active index changes
  useEffect(() => {
    if (dotAnimations.length > 0 && activeIndex < dotAnimations.length) {
      dotAnimations.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: index === activeIndex ? 1 : 0,
          duration,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [activeIndex, dotAnimations, duration]);

  if (count === 0) return null;

  return (
    <View style={[styles.container, { gap }, style]}>
      {Array.from({ length: count }).map((_, i) => {
        const animatedWidth = dotAnimations[i]?.interpolate({
          inputRange: [0, 1],
          outputRange: [dotSize, activeDotSize],
        }) || dotSize;

        const animatedOpacity = dotAnimations[i]?.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        }) || 1;

        const animatedColor = dotAnimations[i]?.interpolate({
          inputRange: [0, 1],
          outputRange: [dotColor, activeDotColor],
        }) || dotColor;

        return (
          <Animated.View
            key={`dot-${i}`}
            style={[
              styles.dot,
              {
                width: animatedWidth,
                height: dotSize,
                opacity: animatedOpacity,
                backgroundColor: animatedColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    borderRadius: 100,
  },
});

