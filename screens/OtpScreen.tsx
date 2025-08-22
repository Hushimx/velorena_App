import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuthStore, useOtpData } from '../store/useAuthStore';
import { ApiError, formatApiError, resendOtp, sendOtp, verifyOtp } from '../utils/api';

const TEAL_600 = '#E9C318';

interface OtpScreenProps {
  initialIdentifier?: string;
  initialType?: 'email' | 'sms' | 'whatsapp';
}

export default function OtpScreen({ 
  initialIdentifier = '', 
  initialType = 'email' 
}: OtpScreenProps) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [otpCode, setOtpCode] = useState('');
  const [otpType, setOtpType] = useState<'email' | 'sms' | 'whatsapp'>(initialType);
  const [countdown, setCountdown] = useState(0);
  const [isCodeSent, setIsCodeSent] = useState(false);

  // Auth store
  const { setLoading, setOtpData, setOtpVerified, clearOtpData, isLoading } = useAuthStore();
  const otpData = useOtpData();

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف');
      return;
    }

    // Basic validation based on type
    if (otpType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier.trim())) {
        Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح');
        return;
      }
    } else if (otpType === 'sms' || otpType === 'whatsapp') {
      const phoneRegex = /^[\+]?[1-9][\d]{7,14}$/;
      if (!phoneRegex.test(identifier.trim().replace(/\s/g, ''))) {
        Alert.alert('خطأ', 'يرجى إدخال رقم هاتف صحيح');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await sendOtp(identifier.trim(), otpType);
      
      // Save OTP data to store
      if (response.otpId) {
        setOtpData(response.otpId, identifier.trim(), otpType, response.expiresAt);
      }
      
      setIsCodeSent(true);
      setCountdown(60); // 60 seconds countdown
      
      const typeText = otpType === 'email' ? 'البريد الإلكتروني' : 
                       otpType === 'sms' ? 'الرسائل النصية' : 'الواتساب';
      
      Alert.alert('تم الإرسال', `تم إرسال رمز التحقق عبر ${typeText}`);
    } catch (error) {
      console.error('Send OTP error:', error);
      
      let errorMessage = 'فشل في إرسال رمز التحقق';
      
      if (error instanceof ApiError) {
        if (error.status === 422) {
          errorMessage = formatApiError(error);
        } else if (error.status === 429) {
          errorMessage = 'تم إرسال الكثير من الطلبات. يرجى المحاولة لاحقاً';
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

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رمز التحقق');
      return;
    }

    if (otpCode.trim().length < 4) {
      Alert.alert('خطأ', 'رمز التحقق يجب أن يكون على الأقل 4 أرقام');
      return;
    }

    if (!otpData.otpIdentifier || !otpData.otpType) {
      Alert.alert('خطأ', 'يرجى إرسال رمز التحقق أولاً');
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOtp(otpData.otpIdentifier, otpCode.trim(), otpData.otpType);
      
      if (response.isVerified) {
        setOtpVerified(true);
        Alert.alert('تم التحقق', 'تم التحقق من الرمز بنجاح', [
          {
            text: 'حسناً',
            onPress: () => {
              // Navigate back or to the next screen
              router.back();
            }
          }
        ]);
      } else {
        Alert.alert('خطأ', 'الرمز غير صالح');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      let errorMessage = 'الرمز غير صالح';
      
      if (error instanceof ApiError) {
        if (error.status === 422) {
          errorMessage = formatApiError(error);
        } else if (error.status === 410) {
          errorMessage = 'انتهت صلاحية الرمز. يرجى طلب رمز جديد';
        } else if (error.status === 429) {
          errorMessage = 'تم تجاوز عدد المحاولات المسموحة. يرجى المحاولة لاحقاً';
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

  const handleResendOtp = async () => {
    if (!otpData.otpIdentifier || !otpData.otpType) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف أولاً');
      return;
    }

    setLoading(true);

    try {
      const response = await resendOtp(otpData.otpIdentifier, otpData.otpType);
      
      // Update OTP data
      if (response.otpId) {
        setOtpData(response.otpId, otpData.otpIdentifier, otpData.otpType, response.expiresAt);
      }
      
      setCountdown(60); // Reset countdown
      setOtpCode(''); // Clear previous code
      
      const typeText = otpData.otpType === 'email' ? 'البريد الإلكتروني' : 
                       otpData.otpType === 'sms' ? 'الرسائل النصية' : 'الواتساب';
      
      Alert.alert('تم الإرسال', `تم إعادة إرسال رمز التحقق عبر ${typeText}`);
    } catch (error) {
      console.error('Resend OTP error:', error);
      
      let errorMessage = 'فشل في إعادة إرسال رمز التحقق';
      
      if (error instanceof ApiError) {
        if (error.status === 429) {
          errorMessage = 'تم إرسال الكثير من الطلبات. يرجى المحاولة لاحقاً';
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

  const handleBack = () => {
    clearOtpData();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <MaterialIcons name="arrow-back" size={24} color="#000000FF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>التحقق برمز OTP</Text>
            <View style={styles.statusBar} />
          </View>

          {/* Form Sheet */}
          <View style={styles.sheet}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* OTP Type Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>طريقة الإرسال</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeButton, otpType === 'email' && styles.typeButtonActive]}
                    onPress={() => setOtpType('email')}
                    disabled={isCodeSent}
                  >
                    <MaterialIcons name="email" size={20} color={otpType === 'email' ? '#fff' : TEAL_600} />
                    <Text style={[styles.typeButtonText, otpType === 'email' && styles.typeButtonTextActive]}>
                      بريد إلكتروني
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, otpType === 'sms' && styles.typeButtonActive]}
                    onPress={() => setOtpType('sms')}
                    disabled={isCodeSent}
                  >
                    <MaterialIcons name="sms" size={20} color={otpType === 'sms' ? '#fff' : TEAL_600} />
                    <Text style={[styles.typeButtonText, otpType === 'sms' && styles.typeButtonTextActive]}>
                      رسالة نصية
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeButton, otpType === 'whatsapp' && styles.typeButtonActive]}
                    onPress={() => setOtpType('whatsapp')}
                    disabled={isCodeSent}
                  >
                    <MaterialIcons name="message" size={20} color={otpType === 'whatsapp' ? '#fff' : TEAL_600} />
                    <Text style={[styles.typeButtonText, otpType === 'whatsapp' && styles.typeButtonTextActive]}>
                      واتساب
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Identifier Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {otpType === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف'}
                </Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons 
                    name={otpType === 'email' ? 'email' : 'phone'} 
                    size={20} 
                    color={TEAL_600} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={otpType === 'email' ? 'example@email.com' : '+966XXXXXXXXX'}
                    placeholderTextColor="#9ca3af"
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType={otpType === 'email' ? 'email-address' : 'phone-pad'}
                    textAlign="right"
                    editable={!isCodeSent}
                  />
                </View>
              </View>

              {/* Send OTP Button */}
              {!isCodeSent && (
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* OTP Code Input */}
              {isCodeSent && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>رمز التحقق</Text>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="security" size={20} color={TEAL_600} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="أدخل رمز التحقق"
                        placeholderTextColor="#9ca3af"
                        value={otpCode}
                        onChangeText={setOtpCode}
                        keyboardType="number-pad"
                        textAlign="right"
                        maxLength={6}
                      />
                    </View>
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                    onPress={handleVerifyOtp}
                    disabled={isLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isLoading ? 'جاري التحقق...' : 'تحقق من الرمز'}
                    </Text>
                  </TouchableOpacity>

                  {/* Resend Button */}
                  <TouchableOpacity
                    style={[styles.resendButton, (countdown > 0 || isLoading) && styles.resendButtonDisabled]}
                    onPress={handleResendOtp}
                    disabled={countdown > 0 || isLoading}
                  >
                    <Text style={[styles.resendButtonText, (countdown > 0 || isLoading) && styles.resendButtonTextDisabled]}>
                      {countdown > 0 ? `إعادة الإرسال خلال ${countdown}ث` : 'إعادة إرسال الرمز'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Status Display */}
              {otpData.isOtpVerified && (
                <View style={styles.successContainer}>
                  <MaterialIcons name="check-circle" size={24} color="#10b981" />
                  <Text style={styles.successText}>تم التحقق بنجاح</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TEAL_600,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: TEAL_600,
  },
  header: {
    height: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'center',
    flex: 1,
  },
  statusBar: {
    width: 40,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  content: {
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: '#374151',
    textAlign: 'right',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: TEAL_600,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: TEAL_600,
  },
  typeButtonText: {
    fontSize: 12,
    fontFamily: 'NotoSansArabic_500Medium',
    color: TEAL_600,
    marginLeft: 4,
    textAlign: 'center',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TEAL_600,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    textAlign: 'right',
  },
  primaryButton: {
    backgroundColor: TEAL_600,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: TEAL_600,
    fontSize: 14,
    fontFamily: 'NotoSansArabic_600SemiBold',
    textDecorationLine: 'underline',
  },
  resendButtonTextDisabled: {
    textDecorationLine: 'none',
    color: '#9ca3af',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: '#10b981',
    marginLeft: 8,
  },
});
