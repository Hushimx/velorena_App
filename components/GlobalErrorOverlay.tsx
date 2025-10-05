import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BRAND_COLORS, BORDER_RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useGlobalErrorStore } from '../store/useGlobalErrorStore';

export const GlobalErrorOverlay: React.FC = () => {
  const { isServerDown, errorMessage, clearError } = useGlobalErrorStore();

  const handleRetry = () => {
    clearError();
    // Optionally trigger a global refresh or navigation
  };

  if (!isServerDown) {
    return null;
  }

  return (
    <Modal
      visible={isServerDown}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <MaterialIcons 
              name="cloud-off" 
              size={64} 
              color={BRAND_COLORS.error} 
            />
          </View>
          
          <Text style={styles.title}>الخادم غير متاح</Text>
          <Text style={styles.message}>
            {errorMessage || 'لا يمكن الاتصال بالخادم حالياً. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.'}
          </Text>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <MaterialIcons name="refresh" size={20} color={BRAND_COLORS.white} />
              <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={clearError}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING['2xl'],
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    ...SHADOWS.xl,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
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
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
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
  closeButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[200],
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    writingDirection: 'rtl',
  },
});
