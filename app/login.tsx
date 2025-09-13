import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PasswordInput, SmartTextInput } from '../components/inputs';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useAuthStore } from '../store/useAuthStore';
import { login } from '../utils/api';
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Auth store
  const { login: authLogin, setLoading, isLoading } = useAuthStore();

  // Keyboard listeners
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);
  const onSubmit = useCallback(async (e?: any) => {
    e?.preventDefault?.();
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    const ac = new AbortController();
    try {
      setLoading(true);
      const res = await login({ email: email.trim(), password }, ac.signal);
      
      // Check if we have user data in the response
      if (res?.data?.user && res?.data?.token) {
        // Save user and token to store using the auth store login function
        authLogin(res.data.user, res.data.token);
        
        // Show success message
        Alert.alert('نجح', 'تم تسجيل الدخول بنجاح', [
          {
            text: 'حسناً',
            onPress: () => router.replace('/(tabs)')
          }
        ]);
      } else {
        Alert.alert('خطأ', 'فشل في الحصول على بيانات المستخدم');
      }
    } catch (e: any) {
      const msg = (e && e.message) ? e.message : 'تعذر الاتصال بالخادم';
      if (msg.includes('timeout') || msg.includes('Timeout')) {
        Alert.alert('انتهت مهلة الاتصال', 'تأكد من اتصال الإنترنت أو أن الخادم يعمل');
      } else if (msg.includes('Network request failed')) {
        Alert.alert('خطأ في الشبكة', 'تأكد من اتصال الإنترنت');
      } else {
        Alert.alert('فشل تسجيل الدخول', msg);
      }
    } finally {
      setLoading(false);
    }
    return () => ac.abort();
  }, [email, password, setLoading, router, authLogin]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor={BRAND_COLORS.background.primary} barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : SPACING['4xl'] }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>تسجيل الدخول في فيلورينا</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <SmartTextInput
              label="البريد الإلكتروني أو اسم المستخدم"
              placeholder="البريد الإلكتروني أو اسم المستخدم"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              scrollViewRef={scrollViewRef}
              returnKeyType="next"
            />

            {/* Password Input */}
            <PasswordInput
              label="كلمة المرور"
              placeholder="كلمة المرور"
              value={password}
              onChangeText={setPassword}
              scrollViewRef={scrollViewRef}
              returnKeyType="done"
            />

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, isLoading && styles.continueButtonDisabled]}
              onPress={onSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? 'جاري تسجيل الدخول...' : 'متابعة'}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>هل نسيت كلمة المرور؟</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>ليس لديك حساب؟</Text>
            <TouchableOpacity onPress={() => router.push('./signup')}>
              <Text style={styles.signupLink}>تسجيل حساب جديد</Text>
            </TouchableOpacity>
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
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING['2xl'],
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height - 100, // Ensure minimum height for centering
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['6xl'],
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginBottom: SPACING['4xl'],
  },
  continueButton: {
    backgroundColor: BRAND_COLORS.secondary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING['2xl'],
  },
  continueButtonDisabled: {
    backgroundColor: BRAND_COLORS.gray[300],
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: SPACING['2xl'],
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  signupLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textDecorationLine: 'underline',
  },
});


