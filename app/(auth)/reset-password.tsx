import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PasswordInput } from '../../components/inputs';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useResetPassword } from '../../hooks/useResetPassword';

const { width } = Dimensions.get('window');

// Validation utilities
const validatePhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.length === 0) {
    return { isValid: false, error: 'رقم الهاتف مطلوب' };
  }
  if (phone.length < 9) {
    return { isValid: false, error: 'رقم الهاتف يجب أن يكون 9 أرقام على الأقل' };
  }
  if (!/^[0-9]+$/.test(phone)) {
    return { isValid: false, error: 'رقم الهاتف يجب أن يحتوي على أرقام فقط' };
  }
  return { isValid: true };
};

const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'كلمة المرور مطلوبة' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }
  return { isValid: true };
};

export default function ResetPasswordScreen() {
  const {
    currentStep,
    isLoading,
    canResendOtp,
    timerDisplay,
    error,
    sendResetOtp,
    verifyResetOtp,
    resendResetOtp,
    completePasswordReset,
    clearError,
  } = useResetPassword();

  // Phone step
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // OTP step
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpIndex, setOtpIndex] = useState(0);

  // Password step
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const otpRefs = useRef<TextInput[]>([]);

  // Animation effect for step transitions
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, slideAnim, fadeAnim]);

  // Display error from hook
  useEffect(() => {
    if (error) {
      // Error will be shown in UI, no need for Alert
    }
  }, [error]);

  const animateTransition = React.useCallback((isBackward = false) => {
    const direction = isBackward ? width : -width;
    const startValue = isBackward ? -width : width;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: direction,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(startValue);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [slideAnim, fadeAnim]);

  const handlePhoneSubmit = async () => {
    const phoneValidation = validatePhone(phoneNumber);
    setPhoneError(phoneValidation.error || '');
    
    if (!phoneValidation.isValid) {
      return;
    }

    const result = await sendResetOtp(phoneNumber);
    if (result && result.success) {
      animateTransition();
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // Clear error when user starts typing
    if (error) clearError();

    // Handle backspace
    if (value === '' && otp[index] !== '') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Handle new digit input
    if (value.length === 1 && /^\d$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next field if current field is filled
      if (index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpValidation = otp.every(digit => digit !== '') && otp.length === 6;
    
    if (!otpValidation) {
      return;
    }

    const otpCode = otp.join('');
    const result = await verifyResetOtp(otpCode);
    if (result && result.success) {
      animateTransition();
    }
  };

  const handlePasswordSubmit = async () => {
    const passwordValidation = validatePassword(newPassword);
    const confirmValidation = newPassword === confirmPassword;

    setPasswordError(passwordValidation.error || '');
    setConfirmPasswordError(confirmValidation ? '' : 'كلمة المرور غير متطابقة');

    if (!passwordValidation.isValid || !confirmValidation) {
      return;
    }

    const result = await completePasswordReset(newPassword, confirmPassword);
    if (result && result.success) {
      Alert.alert('نجح', 'تم إعادة تعيين كلمة المرور بنجاح', [
        {
          text: 'حسناً',
          onPress: () => router.replace('./login')
        }
      ]);
    }
  };

  const handleBack = React.useCallback(() => {
    if (currentStep === 'phone') {
      router.back();
    } else if (currentStep === 'otp') {
      router.back();
    } else if (currentStep === 'password') {
      router.back();
    }
  }, [currentStep, router]);

  // Real-time validation
  const isPhoneValid = phoneNumber.length >= 9 && !phoneError;
  const isOtpValid = otp.every(digit => digit !== '') && otp.length === 6;
  const isPasswordValid = newPassword.length >= 8 && newPassword === confirmPassword && !passwordError && !confirmPasswordError;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            {/* Step Content with Animation */}
            <Animated.View
              style={[
                styles.stepContainer,
                {
                  transform: [{ translateX: slideAnim }],
                  opacity: fadeAnim,
                }
              ]}
            >
              {currentStep === 'phone' && (
                <View style={styles.stepContent}>
                  <Text style={styles.title}>إعادة تعيين كلمة المرور</Text>
                  <Text style={styles.subtitle}>أدخل رقم هاتفك لاستعادة حسابك</Text>

                  <View style={styles.phoneContainer}>
                    <View style={styles.countryCode}>
                      <Text style={styles.flag}>🇸🇦</Text>
                      <Text style={styles.countryText}>+966</Text>
                    </View>
                    <TextInput
                      style={[
                        styles.phoneInput,
                        phoneError && styles.inputError,
                        phoneNumber.length > 0 && !phoneError && styles.inputSuccess
                      ]}
                      placeholder="رقم الهاتف"
                      placeholderTextColor={BRAND_COLORS.text.tertiary}
                      value={phoneNumber}
                      onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (phoneError) setPhoneError('');
                        if (error) clearError();
                      }}
                      keyboardType="phone-pad"
                      maxLength={9}
                      textAlign="left"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                    />
                  </View>
                  {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.continueButton, isPhoneValid && styles.continueButtonActive]}
                    onPress={handlePhoneSubmit}
                    disabled={isLoading}
                  >
                    <Text style={[styles.continueText, isPhoneValid && styles.continueTextActive]}>
                      {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>تذكرت كلمة المرور؟</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                      <Text style={styles.loginLink}>تسجيل الدخول</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {currentStep === 'otp' && (
                <View style={styles.stepContent}>
                  <Text style={styles.title}>أدخل رمز التحقق</Text>
                  <Text style={styles.subtitle}>
                    تم إرسال الرمز إلى {phoneNumber} عبر واتساب
                  </Text>

                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => {
                          if (ref) otpRefs.current[index] = ref;
                        }}
                        style={[
                          styles.otpInput,
                          digit && styles.otpInputFilled,
                          index === otpIndex && styles.otpInputActive,
                          error && styles.otpInputError
                        ]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        textAlign="center"
                        onFocus={() => setOtpIndex(index)}
                        selectTextOnFocus
                        autoCorrect={false}
                        autoComplete="off"
                        textContentType="none"
                      />
                    ))}
                  </View>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.continueButton, isOtpValid && styles.continueButtonActive]}
                    onPress={handleOtpSubmit}
                    disabled={isLoading}
                  >
                    <Text style={[styles.continueText, isOtpValid && styles.continueTextActive]}>
                      {isLoading ? 'جاري التحقق...' : 'تأكيد'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.resendContainer}>
                    {canResendOtp ? (
                      <TouchableOpacity
                        onPress={async () => {
                          const result = await resendResetOtp();
                          if (result.success) {
                            setOtp(['', '', '', '', '', '']);
                          }
                        }}
                        disabled={isLoading}
                        style={styles.resendButton}
                      >
                        <Text style={styles.resendButtonText}>
                          {isLoading ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <Text style={styles.resendText}>إعادة الإرسال خلال</Text>
                        <Text style={styles.timer}>{timerDisplay}</Text>
                      </>
                    )}
                  </View>
                </View>
              )}

              {currentStep === 'password' && (
                <View style={styles.stepContent}>
                  <Text style={styles.title}>كلمة المرور الجديدة</Text>
                  <Text style={styles.subtitle}>أدخل كلمة المرور الجديدة</Text>

                  <View style={styles.formContainer}>
                    <PasswordInput
                      label="كلمة المرور الجديدة"
                      placeholder="أدخل كلمة المرور"
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        if (passwordError) setPasswordError('');
                        if (error) clearError();
                        if (confirmPassword && text !== confirmPassword) {
                          setConfirmPasswordError('كلمة المرور غير متطابقة');
                        } else if (confirmPassword && text === confirmPassword) {
                          setConfirmPasswordError('');
                        }
                      }}
                      returnKeyType="next"
                      containerStyle={styles.inputContainer}
                    />
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                    <PasswordInput
                      label="تأكيد كلمة المرور"
                      placeholder="أدخل كلمة المرور مرة أخرى"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (confirmPasswordError) setConfirmPasswordError('');
                        if (error) clearError();
                        if (newPassword && text !== newPassword) {
                          setConfirmPasswordError('كلمة المرور غير متطابقة');
                        } else if (newPassword && text === newPassword) {
                          setConfirmPasswordError('');
                        }
                      }}
                      returnKeyType="done"
                      containerStyle={styles.inputContainer}
                    />
                    {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={[styles.continueButton, isPasswordValid && styles.continueButtonActive]}
                    onPress={handlePasswordSubmit}
                    disabled={isLoading}
                  >
                    <Text style={[styles.continueText, isPasswordValid && styles.continueTextActive]}>
                      {isLoading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    minHeight: '100%',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: BRAND_COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
  },
  backIcon: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: BRAND_COLORS.text.primary,
    fontWeight: 'bold',
  },
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: SPACING['2xl'],
    paddingBottom: SPACING.xl,
    minHeight: 500,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: TYPOGRAPHY.fontSize['2xl'] * TYPOGRAPHY.lineHeight.tight,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING['3xl'],
    lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.normal,
  },
  // Phone Styles
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
  },
  flag: {
    fontSize: TYPOGRAPHY.fontSize.base,
    marginRight: SPACING.sm,
  },
  countryText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    marginRight: SPACING.sm,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
  },
  // OTP Styles
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: BRAND_COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.success,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginHorizontal: SPACING.xs,
    shadowColor: BRAND_COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  otpInputActive: {
    borderColor: BRAND_COLORS.border.focus,
    shadowColor: BRAND_COLORS.border.focus,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  otpInputFilled: {
    backgroundColor: BRAND_COLORS.background.secondary,
    borderColor: BRAND_COLORS.success,
    shadowColor: BRAND_COLORS.success,
    shadowOpacity: 0.1,
  },
  otpInputError: {
    borderColor: BRAND_COLORS.border.error,
    backgroundColor: BRAND_COLORS.background.tertiary,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    marginRight: SPACING.sm,
  },
  timer: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  resendButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  resendButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.inverse,
  },
  // Form Styles
  formContainer: {
    marginBottom: SPACING['2xl'],
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  // Button Styles
  continueButton: {
    backgroundColor: BRAND_COLORS.gray[100],
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING['2xl'],
    alignItems: 'center',
    shadowColor: BRAND_COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  continueButtonActive: {
    backgroundColor: BRAND_COLORS.primary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  continueText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.tertiary,
  },
  continueTextActive: {
    color: BRAND_COLORS.text.inverse,
  },
  // Login Styles
  loginContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  loginText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  loginLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.primary,
  },
  // Error and Success States
  inputError: {
    borderColor: BRAND_COLORS.border.error,
    backgroundColor: BRAND_COLORS.background.tertiary,
  },
  inputSuccess: {
    borderColor: BRAND_COLORS.border.success,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.error,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    textAlign: 'left',
  },
});

