import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
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
import { PasswordInput, SmartTextInput } from '../../components/inputs';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/Theme';
import { useAuthStore } from '../../store/useAuthStore';
import { login } from '../../utils/api';
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
          {/* Background Pattern */}
          <View style={styles.backgroundPattern} />
          
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoText}>V</Text>
              </View>
            </View>
            <Text style={styles.welcomeTitle}>مرحباً بك</Text>
            <Text style={styles.welcomeSubtitle}>تسجيل الدخول إلى حسابك في فيلورينا</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>تسجيل الدخول</Text>
              <Text style={styles.formSubtitle}>أدخل بياناتك للوصول إلى حسابك</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email Input */}
              <SmartTextInput
                label="البريد الإلكتروني أو اسم المستخدم"
                placeholder="أدخل بريدك الإلكتروني أو اسم المستخدم"
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
                placeholder="أدخل كلمة المرور"
                value={password}
                onChangeText={setPassword}
                scrollViewRef={scrollViewRef}
                returnKeyType="done"
              />

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>هل نسيت كلمة المرور؟</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={onSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>ليس لديك حساب؟</Text>
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => router.push('./signup')}
            >
              <Text style={styles.signupButtonText}>إنشاء حساب جديد</Text>
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
    backgroundColor: BRAND_COLORS.background.tertiary,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['3xl'],
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: BRAND_COLORS.background.secondary,
    borderBottomLeftRadius: BORDER_RADIUS['3xl'],
    borderBottomRightRadius: BORDER_RADIUS['3xl'],
    opacity: 0.1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: SPACING['5xl'],
    paddingTop: SPACING['2xl'],
  },
  logoContainer: {
    marginBottom: SPACING['2xl'],
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: BRAND_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  logoText: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  welcomeTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
  },
  formCard: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING['3xl'],
    marginBottom: SPACING['4xl'],
    ...SHADOWS.lg,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  formTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  formSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: SPACING['2xl'],
  },
  forgotPasswordText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.secondary,
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: BRAND_COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  loginButtonDisabled: {
    backgroundColor: BRAND_COLORS.gray[300],
    ...SHADOWS.sm,
  },
  loginButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
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
    marginBottom: SPACING.lg,
  },
  signupButton: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    ...SHADOWS.sm,
  },
  signupButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.secondary,
  },
});


