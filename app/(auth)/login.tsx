import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
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
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useAuthStore } from '../../store/useAuthStore';
import { login } from '../../utils/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Auth store
  const { login: authLogin, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
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
    <View style={styles.container}>
      <StatusBar backgroundColor={BRAND_COLORS.primary} barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.whiteBackground} />
      
      <KeyboardAvoidingView 
        style={styles.contentWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
        {/* Colored Header Section */}
        <View style={styles.headerBackground}>
          <View style={[styles.headerContent, { paddingTop: insets.top + SPACING.xl }]}>
            <View style={styles.logoSection}>
              <Image 
                source={require('../../assets/images/qaads-logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* White Card Content */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>مرحباً بك</Text>
            <Text style={styles.cardSubtitle}>أدخل بياناتك أدناه</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <SmartTextInput
              label="البريد الإلكتروني"
              placeholder="أدخل بريدك الإلكتروني"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              returnKeyType="next"
              containerStyle={styles.inputContainer}
            />

            {/* Password Input */}
            <PasswordInput
              label="كلمة المرور"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChangeText={setPassword}
              returnKeyType="done"
              containerStyle={styles.inputContainer}
            />

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

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('./reset-password')}
              activeOpacity={0.8}
            >
              <Text style={styles.forgotPasswordText}>هل نسيت كلمة المرور؟</Text>
            </TouchableOpacity>

            {/* Signup Section */}
            <View style={styles.signupSection}>
              <TouchableOpacity 
                style={styles.signupButton}
                onPress={() => router.push('./signup')}
                activeOpacity={0.8}
              >
                <Text style={styles.signupButtonText}>إنشاء حساب جديد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.primary,
  },
  whiteBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '30%',
    backgroundColor: BRAND_COLORS.background.primary,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  headerBackground: {
    backgroundColor: BRAND_COLORS.primary,
    paddingBottom: SPACING['3xl'],
  },
  headerContent: {
    paddingHorizontal: SPACING['2xl'],
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  cardContainer: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderTopLeftRadius: BORDER_RADIUS['3xl'],
    borderTopRightRadius: BORDER_RADIUS['3xl'],
    marginTop: -SPACING['3xl'],
    paddingHorizontal: SPACING['2xl'],
    paddingTop: SPACING['3xl'],
    paddingBottom: 400,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  loginButton: {
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.lg,
  },
  loginButtonDisabled: {
    backgroundColor: BRAND_COLORS.gray[300],
  },
  loginButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.white,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  forgotPasswordText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  signupSection: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border.primary,
  },
  signupText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  signupButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['3xl'],
    width: '100%',
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.primary,
  },
});


