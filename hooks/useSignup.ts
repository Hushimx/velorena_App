import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { sendOtp, verifyOtp, resendOtp, registerUser, checkEmailAvailability, ApiError } from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';

export type SignupStep = 'phone' | 'otp' | 'email' | 'data';
export type AccountType = 'individual' | 'company';

export interface SignupData {
  phoneNumber: string;
  email: string;
  fullName: string;
  companyName?: string;
  contactPerson?: string;
  password: string;
  confirmPassword: string;
  address: string;
  city?: string;
  country?: string;
  accountType: AccountType;
}

export interface OtpData {
  otpId: string;
  expiresAt: string;
  attempts: number;
}

export const useSignup = () => {
  const [currentStep, setCurrentStep] = useState<SignupStep>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [otpData, setOtpData] = useState<OtpData | null>(null);
  const [timer, setTimer] = useState(0);
  const [signupData, setSignupData] = useState<Partial<SignupData>>({});
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxOtpAttempts = 3;

  // Timer effect
  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timer]);

  // Start timer
  const startTimer = useCallback((seconds: number) => {
    setTimer(seconds);
  }, []);

  // Stop timer
  const stopTimer = useCallback(() => {
    setTimer(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Format timer display
  const formatTimer = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Send OTP
  const sendOtpCode = useCallback(async (phoneNumber: string) => {
    try {
      setIsLoading(true);
      
      // Format phone number (add country code if not present)
      const formattedPhone = phoneNumber.startsWith('966') 
        ? phoneNumber 
        : `966${phoneNumber}`;

      const response = await sendOtp(formattedPhone, 'whatsapp', 10);
      
      // The response is already the data object from the API
      setOtpData({
        otpId: (response as any).otp_id,
        expiresAt: (response as any).expires_at,
        attempts: 0,
      });
      
      // Start 30-second timer for resend
      startTimer(30);
      
      setSignupData(prev => ({ ...prev, phoneNumber: formattedPhone }));
      setCurrentStep('otp');
      
      return { success: true };
    } catch (error) {
      console.error('Send OTP error:', error);
      
      let errorMessage = 'فشل في إرسال رمز التحقق';
      
      if (error instanceof ApiError) {
        if (error.status === 422) {
          errorMessage = 'رقم الهاتف غير صحيح';
        } else if (error.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('خطأ', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [startTimer]);

  // Verify OTP
  const verifyOtpCode = useCallback(async (code: string) => {
    if (!otpData || !signupData.phoneNumber) {
      Alert.alert('خطأ', 'بيانات OTP غير متوفرة');
      return { success: false };
    }

    try {
      setIsLoading(true);
      
      // Check attempts limit
      if (otpData.attempts >= maxOtpAttempts) {
        Alert.alert('خطأ', 'تم تجاوز عدد المحاولات المسموح. يرجى طلب رمز جديد');
        return { success: false };
      }

      await verifyOtp(signupData.phoneNumber, code, 'whatsapp');
      
      // OTP verified successfully
      stopTimer();
      setCurrentStep('email');
      return { success: true };
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      // Increment attempts
      setOtpData(prev => prev ? { ...prev, attempts: prev.attempts + 1 } : null);
      
      let errorMessage = 'رمز التحقق غير صحيح';
      
      if (error instanceof ApiError) {
        if (error.status === 400) {
          errorMessage = 'رمز التحقق غير صحيح أو منتهي الصلاحية';
        } else if (error.status === 422) {
          errorMessage = 'تنسيق الرمز غير صحيح';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('خطأ', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [otpData, signupData.phoneNumber, maxOtpAttempts, stopTimer]);

  // Resend OTP
  const resendOtpCode = useCallback(async () => {
    if (!signupData.phoneNumber) {
      Alert.alert('خطأ', 'رقم الهاتف غير متوفر');
      return { success: false };
    }

    try {
      setIsLoading(true);
      
      const response = await resendOtp(signupData.phoneNumber, 'whatsapp', 10);
      
      // The response is already the data object from the API
      setOtpData(prev => prev ? {
        ...prev,
        otpId: (response as any).otp_id,
        expiresAt: (response as any).expires_at,
        attempts: 0, // Reset attempts
      } : null);
      
      // Start 30-second timer for resend
      startTimer(30);
      
      Alert.alert('نجح', 'تم إرسال رمز جديد');
      return { success: true };
    } catch (error) {
      console.error('Resend OTP error:', error);
      
      let errorMessage = 'فشل في إعادة إرسال رمز التحقق';
      
      if (error instanceof ApiError) {
        if (error.status === 422) {
          errorMessage = 'رقم الهاتف غير صحيح';
        } else if (error.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('خطأ', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [signupData.phoneNumber, startTimer]);

  // Check email availability
  const checkEmail = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      
      const response = await checkEmailAvailability(email);
      
      console.log('Email check response:', response);
      
      // The API function now always returns a proper CheckEmailResponse
      if (response.available === true) {
        return { success: true };
      } else {
        Alert.alert('خطأ', 'البريد الإلكتروني مستخدم بالفعل');
        return { success: false, error: 'Email already taken' };
      }
    } catch (error) {
      console.error('Check email error:', error);
      
      let errorMessage = 'فشل في التحقق من البريد الإلكتروني';
      
      if (error instanceof ApiError) {
        if (error.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('خطأ', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update signup data
  const updateSignupData = useCallback((data: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...data }));
  }, []);

  // Complete registration
  const completeRegistration = useCallback(async (finalData: SignupData) => {
    try {
      setIsLoading(true);
      
      const registrationData = {
        client_type: finalData.accountType,
        full_name: finalData.fullName,
        email: finalData.email,
        phone: finalData.phoneNumber,
        address: finalData.address,
        city: finalData.city || '',
        country: finalData.country || 'Saudi Arabia',
        password: finalData.password,
        password_confirmation: finalData.confirmPassword,
        ...(finalData.accountType === 'company' && {
          company_name: finalData.companyName,
          contact_person: finalData.contactPerson,
        }),
      };

      const response = await registerUser(registrationData);
      
      if (response) {
        // Save user and token to auth store (auto-login)
        const authStore = useAuthStore.getState();
        authStore.login(response.user, response.token);
        
        console.log('✅ User registered and logged in automatically');
        
        Alert.alert('نجح', 'تم إنشاء الحساب بنجاح!');
        return { success: true, user: response.user, token: response.token };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'فشل في إنشاء الحساب';
      
      if (error instanceof ApiError) {
        if (error.status === 422) {
          // Handle validation errors
          if (error.errors) {
            const errorMessages = Object.values(error.errors).flat();
            errorMessage = errorMessages.join('\n');
          } else {
            errorMessage = error.message;
          }
        } else if (error.status === 409) {
          errorMessage = 'البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('خطأ', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Navigation helpers
  const goToStep = useCallback((step: SignupStep) => {
    setCurrentStep(step);
  }, []);

  const goBack = useCallback(() => {
    switch (currentStep) {
      case 'otp':
        setCurrentStep('phone');
        stopTimer();
        break;
      case 'email':
        setCurrentStep('otp');
        startTimer(30);
        break;
      case 'data':
        setCurrentStep('email');
        break;
      default:
        break;
    }
  }, [currentStep, stopTimer, startTimer]);

  // Reset signup flow
  const resetSignup = useCallback(() => {
    setCurrentStep('phone');
    setSignupData({});
    setOtpData(null);
    stopTimer();
  }, [stopTimer]);

  return {
    // State
    currentStep,
    isLoading,
    timer,
    otpData,
    signupData,
    
    // Computed
    canResendOtp: timer === 0,
    timerDisplay: formatTimer(timer),
    isOtpExpired: otpData ? new Date(otpData.expiresAt) < new Date() : false,
    hasReachedMaxAttempts: otpData ? otpData.attempts >= maxOtpAttempts : false,
    
    // Actions
    sendOtpCode,
    verifyOtpCode,
    resendOtpCode,
    checkEmail,
    completeRegistration,
    updateSignupData,
    setCurrentStep,
    goToStep,
    goBack,
    resetSignup,
    startTimer,
    stopTimer,
  };
};
