import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BRAND_COLORS, BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  showIcon?: boolean;
  iconName?: string;
  iconSize?: number;
  style?: any;
  fullScreen?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'حدث خطأ',
  message = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
  onRetry,
  retryText = 'إعادة المحاولة',
  showIcon = true,
  iconName = 'error-outline',
  iconSize = 64,
  style,
  fullScreen = false,
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={[containerStyle, style]}>
      {showIcon && (
        <MaterialIcons 
          name={iconName as any} 
          size={iconSize} 
          color={BRAND_COLORS.error} 
          style={styles.icon}
        />
      )}
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      
      {onRetry && (
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <MaterialIcons name="refresh" size={20} color={BRAND_COLORS.white} />
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface SectionErrorProps {
  message?: string;
  onRetry?: () => void;
  style?: any;
}

export const SectionError: React.FC<SectionErrorProps> = ({
  message = 'فشل في تحميل البيانات',
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.sectionContainer, style]}>
      <MaterialIcons name="error-outline" size={24} color={BRAND_COLORS.error} />
      <Text style={styles.sectionMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity 
          style={styles.sectionRetryButton} 
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <MaterialIcons name="refresh" size={16} color={BRAND_COLORS.primary} />
          <Text style={styles.sectionRetryText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  iconName?: string;
  iconSize?: number;
  style?: any;
  fullScreen?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'لا توجد بيانات',
  message = 'لم يتم العثور على أي بيانات للعرض',
  iconName = 'inbox',
  iconSize = 64,
  style,
  fullScreen = false,
}) => {
  const containerStyle = fullScreen ? styles.fullScreenContainer : styles.container;

  return (
    <View style={[containerStyle, style]}>
      <MaterialIcons 
        name={iconName as any} 
        size={iconSize} 
        color={BRAND_COLORS.gray[400]} 
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
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
    padding: SPACING['2xl'],
  },
  sectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  icon: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    writingDirection: 'rtl',
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    marginBottom: SPACING['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    writingDirection: 'rtl',
  },
  sectionMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.error,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    writingDirection: 'rtl',
    flex: 1,
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  retryButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: BRAND_COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    writingDirection: 'rtl',
  },
  sectionRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: BRAND_COLORS.gray[100],
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[200],
    gap: SPACING.xs,
  },
  sectionRetryText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: BRAND_COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    writingDirection: 'rtl',
  },
});
