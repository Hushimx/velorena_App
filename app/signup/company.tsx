import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
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
import { PasswordInput, PhoneInput, SmartTextInput } from '../../components/inputs';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useAuthStore } from '../../store/useAuthStore';
import { ApiError, formatApiError, registerUser } from '../../utils/api';


export default function CompanySignup() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 form data
  const [step1Data, setStep1Data] = useState({
    companyName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    logo: '',
  });
  
  // Step 2 form data
  const [step2Data, setStep2Data] = useState({
    activityDescription: '',
    commercialRegister: '',
    taxRegister: '',
    responsibleName: '',
    jobTitle: '',
    termsAccepted: false,
  });

  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState({
    logo: null as any,
    commercialRegister: null as any,
    taxRegister: null as any,
  });

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

  const handleStep1InputChange = (field: string, value: string) => {
    setStep1Data(prev => ({ ...prev, [field]: value }));
  };

  const handleStep2InputChange = (field: string, value: string) => {
    setStep2Data(prev => ({ ...prev, [field]: value }));
  };

  const handleTermsToggle = () => {
    setStep2Data(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }));
  };

  const handleCountrySelect = (country: any) => {
    setSelectedCountry(country);
  };

  const handleFileUpload = async (field: 'logo' | 'commercialRegister' | 'taxRegister') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: field === 'logo' ? ['image/*'] : ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets[0]) {
        setUploadedFiles(prev => ({ ...prev, [field]: result.assets[0] }));
        if (field === 'logo') {
          setStep1Data(prev => ({ ...prev, logo: result.assets[0].name }));
        } else {
          setStep2Data(prev => ({ ...prev, [field]: result.assets[0].name }));
        }
      }
    } catch (error) {
      console.log('Error picking document:', error);
    }
  };

  const handleNext = () => {
    // Validate step 1
    if (!step1Data.companyName.trim() || !step1Data.mobileNumber.trim() || !step1Data.email.trim() || 
        !step1Data.password || !step1Data.confirmPassword || !step1Data.address.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (step1Data.password !== step1Data.confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(step1Data.email.trim())) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    // Password strength validation
    if (step1Data.password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون على الأقل 6 أحرف');
      return;
    }

    setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      setCurrentStep(1);
    }
  };

  const handleCreateAccount = useCallback(async () => {
    // Validate step 2
    if (!step2Data.activityDescription.trim() || !step2Data.commercialRegister.trim() || 
        !step2Data.responsibleName.trim() || !step2Data.termsAccepted) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة والموافقة على الشروط');
      return;
    }

    setLoading(true);

    try {
      // Prepare registration data for API
      const registrationData = {
        client_type: 'company' as const,
        full_name: step1Data.companyName,
        email: step1Data.email,
        phone: `+${selectedCountry?.callingCode?.[0] || '966'}${step1Data.mobileNumber}`,
        address: step1Data.address,
        city: '', // You might want to extract this from address
        country: typeof selectedCountry?.name === 'string' ? selectedCountry.name : 'Saudi Arabia',
        password: step1Data.password,
        password_confirmation: step1Data.confirmPassword,
        // Company specific fields
        company_name: step1Data.companyName,
        activity_description: step2Data.activityDescription.trim(),
        commercial_register: step2Data.commercialRegister.trim(),
        tax_register: step2Data.taxRegister?.trim() || '',
        responsible_name: step2Data.responsibleName.trim(),
        job_title: step2Data.jobTitle?.trim() || '',
      };

      const registerResponse = await registerUser(registrationData);
      
      // Save user and token to store
      login(registerResponse.user, registerResponse.token);
      
      // Show success message and navigate
      Alert.alert('نجح', 'تم إنشاء الحساب بنجاح', [
        {
          text: 'حسناً',
          onPress: () => router.replace('/(tabs)')
        }
      ]);
    } catch (error) {
      console.error('Company registration error:', error);
      
      let errorMessage = 'فشل إنشاء الحساب';
      
      if (error instanceof ApiError) {
        if (error.status === 422) {
          errorMessage = formatApiError(error);
        } else if (error.status === 409) {
          errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
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
  }, [step1Data, step2Data, selectedCountry, login, router, setLoading]);

  const renderStep1 = () => (
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
      {/* Company Name */}
      <SmartTextInput
        label="اسم الشركة"
        placeholder="اسم الشركة"
        value={step1Data.companyName}
        onChangeText={(value) => handleStep1InputChange('companyName', value)}
        scrollViewRef={scrollViewRef}
      />

      {/* Mobile Number */}
      <PhoneInput
        value={step1Data.mobileNumber}
        onChangeText={(value) => handleStep1InputChange('mobileNumber', value)}
        selectedCountry={selectedCountry}
        onCountrySelect={handleCountrySelect}
        scrollViewRef={scrollViewRef}
      />

      {/* Email */}
      <SmartTextInput
        label="البريد الالكتروني"
        placeholder="البريد الالكتروني"
        value={step1Data.email}
        onChangeText={(value) => handleStep1InputChange('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
        scrollViewRef={scrollViewRef}
      />

      {/* Password */}
      <PasswordInput
        label="كلمة المرور"
        placeholder="ادخل كلمة المرور"
        value={step1Data.password}
        onChangeText={(value) => handleStep1InputChange('password', value)}
        scrollViewRef={scrollViewRef}
      />

      {/* Confirm Password */}
      <PasswordInput
        label="تأكيد كلمة المرور"
        placeholder="تأكيد كلمة المرور"
        value={step1Data.confirmPassword}
        onChangeText={(value) => handleStep1InputChange('confirmPassword', value)}
        scrollViewRef={scrollViewRef}
        returnKeyType="next"
      />

      {/* Address */}
      <SmartTextInput
        label="العنوان"
        placeholder="العنوان (المدينة, الحي, الشارع)"
        value={step1Data.address}
        onChangeText={(value) => handleStep1InputChange('address', value)}
        scrollViewRef={scrollViewRef}
      />

      {/* Logo Upload */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>شعار (اختياري)</Text>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => handleFileUpload('logo')}
        >
          <MaterialIcons name="cloud-upload" size={24} color={BRAND_COLORS.text.secondary} />
          <Text style={styles.uploadText}>
            {uploadedFiles.logo ? uploadedFiles.logo.name : 'تحميل صورة'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Next Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
        <Text style={styles.continueButtonText}>التالي</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
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
      {/* Activity Description */}
      <SmartTextInput
        label="وصف مختصر للنشاط"
        placeholder="اكتب وصف مختصر"
        value={step2Data.activityDescription}
        onChangeText={(value) => handleStep2InputChange('activityDescription', value)}
        scrollViewRef={scrollViewRef}
        multiline
        numberOfLines={3}
        inputStyle={styles.textArea}
      />

      {/* Commercial Register */}
      <View style={styles.inputContainer}>
        <SmartTextInput
          label="السجل التجاري"
          placeholder="رقم السجل التجاري"
          value={step2Data.commercialRegister}
          onChangeText={(value) => handleStep2InputChange('commercialRegister', value)}
          scrollViewRef={scrollViewRef}
          containerStyle={{ marginBottom: SPACING.sm }}
        />
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => handleFileUpload('commercialRegister')}
        >
          <MaterialIcons name="cloud-upload" size={24} color={BRAND_COLORS.text.secondary} />
          <Text style={styles.uploadText}>
            {uploadedFiles.commercialRegister ? uploadedFiles.commercialRegister.name : 'رفع نسخة PDF/JPG'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tax Register */}
      <View style={styles.inputContainer}>
        <SmartTextInput
          label="السجل الضريبي (اختياري)"
          placeholder="رقم السجل الضريبي"
          value={step2Data.taxRegister}
          onChangeText={(value) => handleStep2InputChange('taxRegister', value)}
          scrollViewRef={scrollViewRef}
          containerStyle={{ marginBottom: SPACING.sm }}
        />
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => handleFileUpload('taxRegister')}
        >
          <MaterialIcons name="cloud-upload" size={24} color={BRAND_COLORS.text.secondary} />
          <Text style={styles.uploadText}>
            {uploadedFiles.taxRegister ? uploadedFiles.taxRegister.name : 'رفع نسخة PDF/JPG'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Responsible Name */}
      <SmartTextInput
        label="اسم المسؤول / الممثل القانوني"
        placeholder="اسم المسؤول"
        value={step2Data.responsibleName}
        onChangeText={(value) => handleStep2InputChange('responsibleName', value)}
        scrollViewRef={scrollViewRef}
      />

      {/* Job Title */}
      <SmartTextInput
        label="المسمى الوظيفي (اختياري)"
        placeholder="المسمى الوظيفي"
        value={step2Data.jobTitle}
        onChangeText={(value) => handleStep2InputChange('jobTitle', value)}
        scrollViewRef={scrollViewRef}
      />

      {/* Terms and Conditions */}
      <View style={styles.termsContainer}>
        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={handleTermsToggle}
        >
          <View style={[styles.checkbox, step2Data.termsAccepted && styles.checkboxChecked]}>
            {step2Data.termsAccepted && (
              <MaterialIcons name="check" size={16} color={BRAND_COLORS.text.inverse} />
            )}
          </View>
          <Text style={styles.termsText}>الموافقة على الشروط والاحكام</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.termsLink}>
          <Text style={styles.termsLinkText}>
            للتعرف على الشروط والاحكام أضغط هنا
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
  );

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
            <Text style={styles.title}>تسجيل حساب شركة</Text>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>{currentStep} من 2</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(currentStep / 2) * 100}%` }]} />
            </View>
          </View>

          {/* Form Content */}
          {currentStep === 1 ? renderStep1() : renderStep2()}
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
  stepIndicator: {
    width: 40,
    alignItems: 'center',
  },
  stepText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  progressContainer: {
    paddingBottom: SPACING['2xl'],
  },
  progressBar: {
    height: 4,
    backgroundColor: BRAND_COLORS.gray[200],
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_COLORS.secondary,
    borderRadius: 2,
  },
  form: {
    flex: 1,
  },
  formContent: {
    paddingBottom: SPACING['4xl'],
  },
  inputContainer: {
    marginBottom: SPACING['2xl'],
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: BRAND_COLORS.background.tertiary,
    borderStyle: 'dashed',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  uploadText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
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
