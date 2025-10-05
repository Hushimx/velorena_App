import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
  style?: any;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = BRAND_COLORS.primary,
  text,
  fullScreen = false,
  style,
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

interface SectionLoadingProps {
  text?: string;
  style?: any;
}

export const SectionLoading: React.FC<SectionLoadingProps> = ({
  text = 'جاري التحميل...',
  style,
}) => {
  return (
    <View style={[styles.sectionContainer, style]}>
      <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
      <Text style={styles.sectionText}>{text}</Text>
    </View>
  );
};

interface InlineLoadingProps {
  text?: string;
  style?: any;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = 'جاري التحميل...',
  style,
}) => {
  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
      <Text style={styles.inlineText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.background.primary,
    padding: SPACING['4xl'],
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  text: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  sectionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  inlineText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
