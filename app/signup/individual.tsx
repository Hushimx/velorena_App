import { MaterialIcons } from '@expo/vector-icons';
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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateInput, PasswordInput, PhoneInput, SmartTextInput } from '../../components/inputs';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useAuthStore } from '../../store/useAuthStore';
import { registerIndividual } from '../../utils/api';


export default function IndividualSignup() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    dateOfBirth: '',
    termsAccepted: false,
  });
  
  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  // Auth store
  const { login, setLoading, isLoading } = useAuthStore();

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTermsToggle = () => {
    setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }));
  };

  const handleCountrySelect = (country: any) => {
    setSelectedCountry(country);
  };

  const handleDateSelect = (date: Date) => {
    const formattedDate = date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setFormData(prev => ({ ...prev, dateOfBirth: formattedDate }));
  };

  const handleCreateAccount = useCallback(async () => {
    // Basic validation
    if (!formData.name.trim() || !formData.mobileNumber.trim() || !formData.email.trim() || 
        !formData.password || !formData.confirmPassword || !formData.address.trim() || 
        !formData.dateOfBirth || !formData.termsAccepted) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة والموافقة على الشروط');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    // Password strength validation
    if (formData.password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون على الأقل 6 أحرف');
      return;
    }

    const ac = new AbortController();
    try {
      setLoading(true);
      
      // Prepare registration data for API
      const registrationData = {
        client_type: 'individual' as const,
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        phone: `+${selectedCountry?.callingCode?.[0] || '966'}${formData.mobileNumber.trim()}`,
        address: formData.address.trim(),
        city: '', // You might want to extract this from address
        country: typeof selectedCountry?.name === 'string' ? selectedCountry.name : 'Saudi Arabia',
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        date_of_birth: formData.dateOfBirth,
      };

      const res = await registerIndividual(registrationData, ac.signal);
      
      // Check if we have user data in the response
      if (res?.data?.user && res?.data?.token) {
        // Save user and token to store
        login(res.data.user, res.data.token);
        
        // Show success message and navigate
        Alert.alert('نجح', 'تم إنشاء الحساب بنجاح', [
          {
            text: 'حسناً',
            onPress: () => router.replace('/(tabs)')
          }
        ]);
      } else {
        // Handle successful response but no user data
        Alert.alert('نجح', 'تم إنشاء الحساب بنجاح، يرجى تسجيل الدخول', [
          {
            text: 'حسناً',
            onPress: () => router.replace('/login')
          }
        ]);
      }
    } catch (e: any) {
      const msg = (e && e.message) ? e.message : 'تعذر الاتصال بالخادم';
      if (msg.includes('timeout') || msg.includes('Timeout')) {
        Alert.alert('انتهت مهلة الاتصال', 'تأكد من اتصال الإنترنت أو أن الخادم يعمل');
      } else if (msg.includes('Network request failed')) {
        Alert.alert('خطأ في الشبكة', 'تأكد من اتصال الإنترنت');
      } else {
        Alert.alert('خطأ في التسجيل', msg);
      }
    } finally {
      setLoading(false);
    }
    return () => ac.abort();
  }, [formData, selectedCountry, login, router, setLoading]);

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor={BRAND_COLORS.background.primary} barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>تسجيل حساب فردي</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Form */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.form} 
            contentContainerStyle={[
              styles.formContent,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : SPACING['4xl'] }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          >
            {/* Name */}
            <SmartTextInput
              label="الاسم الكامل"
              placeholder="الاسم الكامل"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              scrollViewRef={scrollViewRef}
            />

            {/* Mobile Number */}
            <PhoneInput
              value={formData.mobileNumber}
              onChangeText={(value) => handleInputChange('mobileNumber', value)}
              selectedCountry={selectedCountry}
              onCountrySelect={handleCountrySelect}
              scrollViewRef={scrollViewRef}
            />

            {/* Email */}
            <SmartTextInput
              label="البريد الالكتروني"
              placeholder="البريد الالكتروني"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              scrollViewRef={scrollViewRef}
            />

            {/* Password */}
            <PasswordInput
              label="كلمة المرور"
              placeholder="ادخل كلمة المرور"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              scrollViewRef={scrollViewRef}
            />

            {/* Confirm Password */}
            <PasswordInput
              label="تأكيد كلمة المرور"
              placeholder="تأكيد كلمة المرور"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              scrollViewRef={scrollViewRef}
              returnKeyType="next"
            />

            {/* Address */}
            <SmartTextInput
              label="العنوان"
              placeholder="العنوان (المدينة, الحي, الشارع)"
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              scrollViewRef={scrollViewRef}
            />

            {/* Date of Birth */}
            <DateInput
              value={formData.dateOfBirth}
              onDateSelect={handleDateSelect}
            />

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={handleTermsToggle}
              >
                <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
                  {formData.termsAccepted && (
                    <MaterialIcons name="check" size={16} color={BRAND_COLORS.text.inverse} />
                  )}
                </View>
                <Text style={styles.termsText}>الموافقة على الشروط والاحكام</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.termsLink}>
                <Text style={styles.termsLinkText}>
                  للتعرف على الشروط و الأحكام اضغط
                </Text>
              </TouchableOpacity>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity 
              style={[styles.continueButton, isLoading && styles.continueButtonDisabled]} 
              onPress={handleCreateAccount}
              disabled={isLoading}
            >
              <Text style={styles.continueButtonText}>
                {isLoading ? 'جاري إنشاء الحساب...' : 'انشاء حساب'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
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
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING['2xl'],
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingBottom: SPACING['4xl'],
  },
  termsContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: BRAND_COLORS.border.primary,
    marginRight: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  termsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  termsLink: {
    marginLeft: 36,
  },
  termsLinkText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textDecorationLine: 'underline',
    textAlign: 'right',
  },
  continueButton: {
    backgroundColor: BRAND_COLORS.secondary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  continueButtonDisabled: {
    backgroundColor: BRAND_COLORS.gray[300],
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
});
