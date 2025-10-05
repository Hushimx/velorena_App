import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { forwardRef, useCallback, useMemo, useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AuthBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  title?: string;
  message?: string;
  showCloseButton?: boolean;
}

const AuthBottomSheet = forwardRef<BottomSheetModal, AuthBottomSheetProps>(({
  bottomSheetRef,
  title = 'تسجيل الدخول مطلوب',
  message = 'يجب تسجيل الدخول أولاً للوصول إلى هذه الميزة',
  showCloseButton = true,
}, ref) => {
  const router = useRouter();
  const snapPoints = useMemo(() => ['60%', '80%'], []);

  // Fix for iOS bottom sheet display issue
  useEffect(() => {
    if (Platform.OS === 'ios' && bottomSheetRef.current) {
      // Force a small delay to ensure proper rendering on iOS
      const timer = setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [bottomSheetRef]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={() => bottomSheetRef.current?.dismiss()}
      />
    ),
    [bottomSheetRef]
  );

  const handleLogin = () => {
    bottomSheetRef.current?.dismiss();
    router.push('/login');
  };

  const handleRegister = () => {
    bottomSheetRef.current?.dismiss();
    router.push('/signup');
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      android_keyboardInputMode="adjustResize"
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          {showCloseButton && (
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.dismiss()}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={BRAND_COLORS.text.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Content */}
        <View style={styles.scrollableContent}>
          {/* Icon and Message */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock" size={32} color={BRAND_COLORS.primary} />
            </View>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <MaterialIcons name="login" size={20} color="white" />
              <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              activeOpacity={0.8}
            >
              <MaterialIcons name="person-add" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.registerButtonText}>إنشاء حساب جديد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

AuthBottomSheet.displayName = 'AuthBottomSheet';

export default AuthBottomSheet;

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: BRAND_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: BRAND_COLORS.gray[300],
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  scrollableContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[200],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: BRAND_COLORS.secondary,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  buttonContainer: {
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  loginButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: BRAND_COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  registerButton: {
    backgroundColor: BRAND_COLORS.secondary,
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  registerButtonText: {
    color: BRAND_COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
});
