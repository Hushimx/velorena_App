import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    BackHandler,
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
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useSignup } from '../../hooks/useSignup';

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

const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || email.length === 0) {
    return { isValid: false, error: 'البريد الإلكتروني مطلوب' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'البريد الإلكتروني غير صحيح' };
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

const validateName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'الاسم مطلوب' };
  }
  if (name.trim().length < 2) {
    return { isValid: false, error: 'الاسم يجب أن يكون حرفين على الأقل' };
  }
  return { isValid: true };
};

export default function SignupScreen() {
  const {
    currentStep,
    isLoading,
    canResendOtp,
    timerDisplay,
    signupData,
    sendOtpCode,
    verifyOtpCode,
    resendOtpCode,
    checkEmail,
    completeRegistration,
    updateSignupData,
    setCurrentStep,
  } = useSignup();

  const [activeTab, setActiveTab] = useState<'individual' | 'company'>('individual');
  
  // Phone step
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // OTP step
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpIndex, setOtpIndex] = useState(0);
  const [otpError, setOtpError] = useState('');
  
  // Email step
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Data step
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [nameError, setNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [contactError, setContactError] = useState('');
  
  // Password visibility
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

  // Validation functions
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 'phone':
        const phoneValidation = validatePhone(phoneNumber);
        setPhoneError(phoneValidation.error || '');
        return phoneValidation.isValid;
      case 'otp':
        const otpValidation = otp.every(digit => digit !== '') && otp.length === 6;
        setOtpError(otpValidation ? '' : 'يرجى إدخال رمز التحقق كاملاً');
        return otpValidation;
      case 'email':
        const emailValidation = validateEmail(email);
        setEmailError(emailValidation.error || '');
        return emailValidation.isValid;
      case 'data':
        if (activeTab === 'individual') {
          const nameValidation = validateName(fullName);
          const passwordValidation = validatePassword(password);
          const confirmValidation = password === confirmPassword;
          
          setNameError(nameValidation.error || '');
          setPasswordError(passwordValidation.error || '');
          setConfirmPasswordError(confirmValidation ? '' : 'كلمة المرور غير متطابقة');
          
          return nameValidation.isValid && passwordValidation.isValid && confirmValidation;
        } else {
          const companyValidation = validateName(companyName);
          const contactValidation = validateName(contactPerson);
          const passwordValidation = validatePassword(password);
          const confirmValidation = password === confirmPassword;
          
          setCompanyError(companyValidation.error || '');
          setContactError(contactValidation.error || '');
          setPasswordError(passwordValidation.error || '');
          setConfirmPasswordError(confirmValidation ? '' : 'كلمة المرور غير متطابقة');
          
          return companyValidation.isValid && contactValidation.isValid && passwordValidation.isValid && confirmValidation;
        }
      default:
        return false;
    }
  };

  // Real-time validation
  const isPhoneValid = phoneNumber.length >= 9 && !phoneError;
  const isOtpValid = otp.every(digit => digit !== '') && otp.length === 6 && !otpError;
  const isEmailValid = email.includes('@') && email.includes('.') && !emailError;
  const isDataValid = activeTab === 'individual' 
    ? fullName.length > 0 && password.length >= 8 && password === confirmPassword && !nameError && !passwordError && !confirmPasswordError
    : companyName.length > 0 && contactPerson.length > 0 && password.length >= 8 && password === confirmPassword && !companyError && !contactError && !passwordError && !confirmPasswordError;

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
    if (!validateCurrentStep()) {
      return;
    }
    
    const result = await sendOtpCode(phoneNumber);
    if (result && result.success) {
      // The hook already updates the step to 'otp'
      animateTransition();
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // Clear error when user starts typing
    if (otpError) setOtpError('');
    
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
    if (!validateCurrentStep()) {
      return;
    }
    
    const otpCode = otp.join('');
    const result = await verifyOtpCode(otpCode);
    if (result && result.success) {
      // The hook already updates the step to 'email'
      animateTransition();
    }
  };

  const handleEmailSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }
    
    // Check email availability
    const result = await checkEmail(email);
    if (result && result.success) {
      // Update signup data with email
      updateSignupData({ email });
      // Move to data step manually since hook doesn't do it
      setCurrentStep('data');
      animateTransition();
    }
  };

  const handleDataSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }
    
    const finalData = {
      phoneNumber: signupData?.phoneNumber || phoneNumber,
      email: signupData?.email || email,
      fullName,
      companyName: activeTab === 'company' ? companyName : undefined,
      contactPerson: activeTab === 'company' ? contactPerson : undefined,
      password,
      confirmPassword,
      address: 'Default Address', // You can add address input if needed
      city: 'Riyadh',
      country: 'Saudi Arabia',
      accountType: activeTab,
    };
    
    const result = await completeRegistration(finalData);
    if (result && result.success) {
      // Navigate to main app or login
      router.replace('/(tabs)');
    }
  };

  const handleBack = React.useCallback(() => {
    if (currentStep === 'phone') {
      router.back();
    } else if (currentStep === 'otp') {
      setCurrentStep('phone');
      animateTransition(true);
    } else if (currentStep === 'email') {
      setCurrentStep('otp');
      animateTransition(true);
    } else if (currentStep === 'data') {
      setCurrentStep('email');
      animateTransition(true);
    }
  }, [currentStep, router, animateTransition, setCurrentStep]);

  // Handle physical back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [handleBack])
  );

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
              <Text style={styles.title}>أدخل رقم هاتفك</Text>
              
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
                  }}
                  keyboardType="phone-pad"
                  maxLength={9}
                  textAlign="left"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                />
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

              <TouchableOpacity 
                style={[styles.continueButton, isPhoneValid && styles.continueButtonActive]} 
                onPress={handlePhoneSubmit}
                disabled={isLoading}
              >
                <Text style={[styles.continueText, isPhoneValid && styles.continueTextActive]}>
                  {isLoading ? 'جاري الإرسال...' : 'متابعة'}
                </Text>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>لديك حساب بالفعل؟</Text>
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
                تم إرسال الرمز إلى {signupData?.phoneNumber || phoneNumber} عبر واتساب
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
                      otpError && styles.otpInputError
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
              {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

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
                      const result = await resendOtpCode();
                      if (result.success) {
                        setOtp(['', '', '', '', '', '']);
                        setOtpError('');
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

          {currentStep === 'email' && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>أدخل بريدك الإلكتروني</Text>
              
              <TextInput
                style={[
                  styles.emailInput,
                  emailError && styles.inputError,
                  email.length > 0 && !emailError && styles.inputSuccess
                ]}
                placeholder="البريد الإلكتروني"
                placeholderTextColor={BRAND_COLORS.text.tertiary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="left"
                autoComplete="email"
                textContentType="emailAddress"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              <TouchableOpacity 
                style={[styles.continueButton, isEmailValid && styles.continueButtonActive]} 
                onPress={handleEmailSubmit}
                disabled={isLoading}
              >
                <Text style={[styles.continueText, isEmailValid && styles.continueTextActive]}>
                  {isLoading ? 'جاري التحقق...' : 'متابعة'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.termsText}>
                بالمتابعة، أنت توافق على{' '}
                <Text style={styles.termsLink}>الشروط والأحكام</Text>
                {' '}و{' '}
                <Text style={styles.termsLink}>سياسة الخصوصية</Text>
              </Text>
            </View>
          )}

          {currentStep === 'data' && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>معلوماتك الشخصية</Text>
              
              {/* Account Type Selector */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeOption, activeTab === 'individual' && styles.typeOptionActive]}
                  onPress={() => setActiveTab('individual')}
                >
                  <Text style={styles.typeEmoji}>👤</Text>
                  <Text style={[styles.typeTitle, activeTab === 'individual' && styles.typeTitleActive]}>
                    حساب فردي
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.typeOption, activeTab === 'company' && styles.typeOptionActive]}
                  onPress={() => setActiveTab('company')}
                >
                  <Text style={styles.typeEmoji}>🏢</Text>
                  <Text style={[styles.typeTitle, activeTab === 'company' && styles.typeTitleActive]}>
                    حساب شركة
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                {activeTab === 'individual' ? (
                  <>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="person-outline" size={20} color={BRAND_COLORS.text.tertiary} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          nameError && styles.inputError,
                          fullName.length > 0 && !nameError && styles.inputSuccess
                        ]}
                        placeholder="الاسم الكامل"
                        placeholderTextColor={BRAND_COLORS.text.tertiary}
                        value={fullName}
                        onChangeText={(text) => {
                          setFullName(text);
                          if (nameError) setNameError('');
                        }}
                        autoCapitalize="words"
                        textAlign="left"
                        autoComplete="name"
                        textContentType="name"
                      />
                    </View>
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                    
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="lock-closed-outline" size={20} color={BRAND_COLORS.text.tertiary} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          passwordError && styles.inputError,
                          password.length > 0 && !passwordError && styles.inputSuccess
                        ]}
                        placeholder="كلمة المرور"
                        placeholderTextColor={BRAND_COLORS.text.tertiary}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (passwordError) setPasswordError('');
                          if (confirmPassword && text !== confirmPassword) {
                            setConfirmPasswordError('كلمة المرور غير متطابقة');
                          } else if (confirmPassword && text === confirmPassword) {
                            setConfirmPasswordError('');
                          }
                        }}
                        secureTextEntry={!showPassword}
                        textAlign="left"
                        autoComplete="new-password"
                        textContentType="newPassword"
                      />
                      <TouchableOpacity 
                        style={styles.passwordToggle}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={BRAND_COLORS.text.tertiary} 
                        />
                      </TouchableOpacity>
                    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                    
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={BRAND_COLORS.text.tertiary} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          confirmPasswordError && styles.inputError,
                          confirmPassword.length > 0 && !confirmPasswordError && styles.inputSuccess
                        ]}
                        placeholder="تأكيد كلمة المرور"
                        placeholderTextColor={BRAND_COLORS.text.tertiary}
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (confirmPasswordError) setConfirmPasswordError('');
                          if (password && text !== password) {
                            setConfirmPasswordError('كلمة المرور غير متطابقة');
                          } else if (password && text === password) {
                            setConfirmPasswordError('');
                          }
                        }}
                        secureTextEntry={!showConfirmPassword}
                        textAlign="left"
                        autoComplete="new-password"
                        textContentType="newPassword"
                      />
                      <TouchableOpacity 
                        style={styles.passwordToggle}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons 
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={BRAND_COLORS.text.tertiary} 
                        />
                      </TouchableOpacity>
                    </View>
                    {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                  </>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="business-outline" size={20} color={BRAND_COLORS.text.tertiary} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          companyError && styles.inputError,
                          companyName.length > 0 && !companyError && styles.inputSuccess
                        ]}
                        placeholder="اسم الشركة"
                        placeholderTextColor={BRAND_COLORS.text.tertiary}
                        value={companyName}
                        onChangeText={(text) => {
                          setCompanyName(text);
                          if (companyError) setCompanyError('');
                        }}
                        autoCapitalize="words"
                        textAlign="left"
                        autoComplete="organization"
                        textContentType="organizationName"
                      />
                    </View>
                    {companyError ? <Text style={styles.errorText}>{companyError}</Text> : null}
                    
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="person-outline" size={20} color={BRAND_COLORS.text.tertiary} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          contactError && styles.inputError,
                          contactPerson.length > 0 && !contactError && styles.inputSuccess
                        ]}
                        placeholder="الشخص المسؤول"
                        placeholderTextColor={BRAND_COLORS.text.tertiary}
                        value={contactPerson}
                        onChangeText={(text) => {
                          setContactPerson(text);
                          if (contactError) setContactError('');
                        }}
                        autoCapitalize="words"
                        textAlign="left"
                        autoComplete="name"
                        textContentType="name"
                      />
                    </View>
                    {contactError ? <Text style={styles.errorText}>{contactError}</Text> : null}
                    
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="lock-closed-outline" size={20} color={BRAND_COLORS.text.tertiary} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          passwordError && styles.inputError,
                          password.length > 0 && !passwordError && styles.inputSuccess
                        ]}
                        placeholder="كلمة المرور"
                        placeholderTextColor={BRAND_COLORS.text.tertiary}
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          if (passwordError) setPasswordError('');
                          if (confirmPassword && text !== confirmPassword) {
                            setConfirmPasswordError('كلمة المرور غير متطابقة');
                          } else if (confirmPassword && text === confirmPassword) {
                            setConfirmPasswordError('');
                          }
                        }}
                        secureTextEntry={!showPassword}
                        textAlign="left"
                        autoComplete="new-password"
                        textContentType="newPassword"
                      />
                      <TouchableOpacity 
                        style={styles.passwordToggle}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={BRAND_COLORS.text.tertiary} 
                        />
                      </TouchableOpacity>
                    </View>
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                    
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={BRAND_COLORS.text.tertiary} />
                      </View>
                      <TextInput
                        style={[
                          styles.input,
                          confirmPasswordError && styles.inputError,
                          confirmPassword.length > 0 && !confirmPasswordError && styles.inputSuccess
                        ]}
                        placeholder="تأكيد كلمة المرور"
                        placeholderTextColor={BRAND_COLORS.text.tertiary}
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (confirmPasswordError) setConfirmPasswordError('');
                          if (password && text !== password) {
                            setConfirmPasswordError('كلمة المرور غير متطابقة');
                          } else if (password && text === password) {
                            setConfirmPasswordError('');
                          }
                        }}
                        secureTextEntry={!showConfirmPassword}
                        textAlign="left"
                        autoComplete="new-password"
                        textContentType="newPassword"
                      />
                      <TouchableOpacity 
                        style={styles.passwordToggle}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <Ionicons 
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={BRAND_COLORS.text.tertiary} 
                        />
                      </TouchableOpacity>
                    </View>
                    {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                  </>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.continueButton, isDataValid && styles.continueButtonActive]} 
                onPress={handleDataSubmit}
                disabled={isLoading}
              >
                <Text style={[styles.continueText, isDataValid && styles.continueTextActive]}>
                  {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
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
    minHeight: 500, // Ensure minimum height for proper layout
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING['3xl'],
    lineHeight: TYPOGRAPHY.fontSize['2xl'] * TYPOGRAPHY.lineHeight.tight,
    minHeight: 44,
    paddingVertical: SPACING.xs,
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
    marginBottom: SPACING['3xl'],
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
  dropdown: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.tertiary,
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
    marginBottom: SPACING['3xl'],
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
  // Email Styles
  emailInput: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    marginBottom: SPACING['3xl'],
  },
  // Button Styles
  continueButton: {
    backgroundColor: BRAND_COLORS.gray[100],
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING['3xl'],
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
  // Terms Styles
  termsText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.xs * TYPOGRAPHY.lineHeight.normal,
  },
  termsLink: {
    color: BRAND_COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
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
  // Type Selector Styles
  typeSelector: {
    flexDirection: 'row',
    marginBottom: SPACING['2xl'],
    gap: SPACING.lg,
  },
  typeOption: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BRAND_COLORS.border.primary,
    shadowColor: BRAND_COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  typeOptionActive: {
    borderColor: BRAND_COLORS.primary,
    backgroundColor: BRAND_COLORS.background.secondary,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  typeEmoji: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    marginBottom: SPACING.xs,
  },
  typeTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  typeTitleActive: {
    color: BRAND_COLORS.primary,
  },
  // Form Styles
  formContainer: {
    marginBottom: SPACING['2xl'],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    marginBottom: SPACING.md,
    shadowColor: BRAND_COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    paddingVertical: SPACING.md,
    paddingRight: SPACING.md,
    minHeight: 44, // Fixed height to prevent growing
    textAlignVertical: 'center',
  },
  passwordToggle: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
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