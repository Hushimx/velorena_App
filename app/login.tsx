import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { ApiError, formatApiError, loginUser } from '../utils/api';
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const router = useRouter();
  const appear = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const primaryBtnPress = useRef(new Animated.Value(0)).current;
  const googleBtnPress = useRef(new Animated.Value(0)).current;
  const facebookBtnPress = useRef(new Animated.Value(0)).current;

  // Auth store
  const { login, setLoading, isLoading } = useAuthStore();

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appear, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [appear, headerAnim]);

  const pressIn = (v: Animated.Value) =>
    Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = (v: Animated.Value) =>
    Animated.spring(v, { toValue: 0, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const handleSubmit = async () => {
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

    setLoading(true);

    try {
      const loginResponse = await loginUser(email.trim(), password);
      
      // Save user and token to store
      login(loginResponse.user, loginResponse.token);
      
      // Show success message
      Alert.alert('نجح', 'تم تسجيل الدخول بنجاح', [
        {
          text: 'حسناً',
          onPress: () => router.replace('/(tabs)')
        }
      ]);
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'فشل تسجيل الدخول';
      
      if (error instanceof ApiError) {
        if (error.status === 401) {
          errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (error.status === 422) {
          errorMessage = formatApiError(error);
        } else if (error.status === 0) {
          errorMessage = 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('خطأ', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.headerArea,
              {
                opacity: headerAnim,
                transform: [
                  { translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                ],
              },
            ]}
          >
            <Text style={styles.title}>تسجيل الدخول</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              {
                opacity: appear,
                transform: [
                  { translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
                ],
              },
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Email */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelText}>تسجيل الدخول</Text>
                  <MaterialIcons name="email" size={18} color={BROWN_DARK} style={styles.labelIcon} />
                </View>

                <View style={styles.inputWrapper}>
                  <MaterialIcons name="email" size={20} color={BROWN_DARK} style={styles.leftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="@gmail.com"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelRow}>
                  <Text style={styles.labelText}>الباسورد</Text>
                  <MaterialIcons name="lock" size={18} color={BROWN_DARK} style={styles.labelIcon} />
                </View>

                <View style={styles.inputWrapper}>
                  <TouchableOpacity
                    onPress={() => setIsPasswordHidden(prev => !prev)}
                    style={styles.leftIcon}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={isPasswordHidden ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={BROWN_DARK}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.textInput}
                    placeholder="ادخل كلمة السر"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={isPasswordHidden}
                    textContentType="password"
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {/* Forgot password */}
              <View style={styles.forgotRow}>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>هل نسيت الباسورد؟</Text>
                </TouchableOpacity>
              </View>

              {/* Submit */}
              <Animated.View
                style={{ transform: [{ scale: primaryBtnPress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) }] }}
              >
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                  onPress={handleSubmit}
                  activeOpacity={0.9}
                  onPressIn={() => !isLoading && pressIn(primaryBtnPress)}
                  onPressOut={() => !isLoading && pressOut(primaryBtnPress)}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerLabel}>أو</Text>
                <View style={styles.divider} />
              </View>

              {/* Social buttons */}
              <View style={styles.socialColumn}>
                <Animated.View style={{ transform: [{ scale: googleBtnPress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) }] }}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.9}
                    onPressIn={() => pressIn(googleBtnPress)}
                    onPressOut={() => pressOut(googleBtnPress)}
                  >
                    <FontAwesome5 name="google" size={25} color="#DB4437" style={styles.socialIcon} />
                    <Text style={styles.socialText}>تسجيل الدخول باستخدام جوجل</Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ transform: [{ scale: facebookBtnPress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) }] }}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    activeOpacity={0.9}
                    onPressIn={() => pressIn(facebookBtnPress)}
                    onPressOut={() => pressOut(facebookBtnPress)}
                  >
                    <FontAwesome5 name="facebook" size={25} color="#1877F2" style={styles.socialIcon} />
                    <Text style={styles.socialText}>تسجيل الدخول بحساب الفيس بوك</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Sign up link */}
              <View style={styles.signupRow}>
                <TouchableOpacity onPress={() => router.push('./signup')}>
                  <Text style={styles.signupText}>انشاء حساب جديد ؟</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const YELLOW = '#ffde9f';
const BROWN_DARK = '#2a1e1e';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  headerArea: {
    height: '25%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: BROWN_DARK,
    fontSize: 32,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    writingDirection: 'rtl',
  },
  formContent: {
    paddingBottom: 32,
    alignItems: 'stretch',
  },
  fieldBlock: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    minHeight: 24,
  },
  labelText: {
    color: BROWN_DARK,
    fontSize: 14,
    fontFamily: 'NotoSansArabic_700Bold',
    marginLeft: 6,
  },
  labelIcon: {
    marginTop: 1,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    minHeight: 48,
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: YELLOW,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 40,
    color: BROWN_DARK,
    textAlign: 'right',
    backgroundColor: '#fff',
    textAlignVertical: 'center',
    width: '100%',
  },
  forgotRow: {
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 24,
    width: '100%',
  },
  forgotText: {
    color: BROWN_DARK,
    fontSize: 13,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  primaryButton: {
    backgroundColor: BROWN_DARK,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  dividerRow: {
    marginVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerLabel: {
    marginHorizontal: 12,
    color: BROWN_DARK,
  },
  socialColumn: {
    gap: 12,
    width: '100%',
  },
  socialButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: YELLOW,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    minHeight: 48,
  },
  socialLogo: {
    width: 18,
    height: 18,
    marginRight: 8,
    resizeMode: 'contain',
  },
  socialIcon: {
    marginRight: 8,
  },
  socialText: {
    color: BROWN_DARK,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  signupRow: {
    marginTop: 28,
    alignItems: 'center',
  },
  signupText: {
    color: BROWN_DARK,
    fontFamily: 'NotoSansArabic_700Bold',
  },
});


