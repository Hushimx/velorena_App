import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, forgotPassword, resetPassword, resendOtp, verifyOtp } from '../utils/api';

export type ResetPasswordStep = 'phone' | 'otp' | 'password';

export interface ResetPasswordData {
  phoneNumber: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OtpData {
  otpId?: number;
  phone?: string;
  expiresAt?: string;
  attempts: number;
}

export const useResetPassword = () => {
  const [currentStep, setCurrentStep] = useState<ResetPasswordStep>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [otpData, setOtpData] = useState<OtpData | null>(null);
  const [timer, setTimer] = useState(0);
  const [resetData, setResetData] = useState<Partial<ResetPasswordData>>({});
  const [error, setError] = useState<string>('');
  
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

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Send OTP for password reset
  const sendResetOtp = useCallback(async (phoneNumber: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Format phone number (add country code if not present)
      const formattedPhone = phoneNumber.startsWith('966') 
        ? phoneNumber 
        : `966${phoneNumber}`;

      const response = await forgotPassword(formattedPhone);
      
      setOtpData({
        otpId: response.otp_id,
        phone: response.phone || formattedPhone,
        attempts: 0,
      });
      
      // Start 30-second timer for resend
      startTimer(30);
      
      setResetData(prev => ({ ...prev, phoneNumber: formattedPhone }));
      setCurrentStep('otp');
      
      return { success: true };
    } catch (error) {
      let errorMessage = 'فشل في إرسال رمز التحقق';
      
      if (error instanceof ApiError) {
        if (error.status === 422) {
          errorMessage = 'رقم الهاتف غير مسجل في النظام';
        } else if (error.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [startTimer]);

  // Verify OTP
  const verifyResetOtp = useCallback(async (code: string) => {
    if (!otpData || !resetData.phoneNumber) {
      setError('بيانات OTP غير متوفرة');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Check attempts limit
      if (otpData.attempts >= maxOtpAttempts) {
        setError('تم تجاوز عدد المحاولات المسموح. يرجى طلب رمز جديد');
        return { success: false };
      }

      await verifyOtp(resetData.phoneNumber, code, 'whatsapp');
      
      // OTP verified successfully
      stopTimer();
      setResetData(prev => ({ ...prev, code }));
      setCurrentStep('password');
      return { success: true };
    } catch (error) {
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
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [otpData, resetData.phoneNumber, maxOtpAttempts, stopTimer]);

  // Resend OTP
  const resendResetOtp = useCallback(async () => {
    if (!resetData.phoneNumber) {
      setError('رقم الهاتف غير متوفر');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await resendOtp(resetData.phoneNumber, 'whatsapp', 10);
      
      setOtpData(prev => prev ? {
        ...prev,
        otpId: (response as any).otp_id,
        expiresAt: (response as any).expires_at,
        attempts: 0, // Reset attempts
      } : null);
      
      // Start 30-second timer for resend
      startTimer(30);
      
      return { success: true };
    } catch (error) {
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
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [resetData.phoneNumber, startTimer]);

  // Reset password
  const completePasswordReset = useCallback(async (newPassword: string, confirmPassword: string) => {
    if (!resetData.phoneNumber || !resetData.code) {
      setError('بيانات إعادة التعيين غير مكتملة');
      return { success: false };
    }

    try {
      setIsLoading(true);
      setError('');
      
      const response = await resetPassword(
        resetData.phoneNumber,
        resetData.code,
        newPassword,
        confirmPassword
      );
      
      return { success: true, message: response.message };
    } catch (error) {
      let errorMessage = 'فشل في إعادة تعيين كلمة المرور';
      
      if (error instanceof ApiError) {
        if (error.status === 422) {
          if (error.errors) {
            const errorMessages = Object.values(error.errors).flat();
            errorMessage = errorMessages.join('\n');
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [resetData.phoneNumber, resetData.code]);

  // Reset flow
  const resetFlow = useCallback(() => {
    setCurrentStep('phone');
    setResetData({});
    setOtpData(null);
    setError('');
    stopTimer();
  }, [stopTimer]);

  return {
    // State
    currentStep,
    isLoading,
    timer,
    otpData,
    resetData,
    error,
    
    // Computed
    canResendOtp: timer === 0,
    timerDisplay: formatTimer(timer),
    hasReachedMaxAttempts: otpData ? otpData.attempts >= maxOtpAttempts : false,
    
    // Actions
    sendResetOtp,
    verifyResetOtp,
    resendResetOtp,
    completePasswordReset,
    setCurrentStep,
    clearError,
    resetFlow,
  };
};

