import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../utils/api';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const initiatePayment = async (orderId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/orders/${orderId}/payment`, {
        method: 'POST'
      });

      if (response.success && response.data?.payment_url) {
        // Navigate to PaymentWebView screen instead of external browser
        router.push({
          pathname: '/payment/webview' as any,
          params: { 
            paymentUrl: response.data.payment_url,
            orderId: orderId.toString()
          }
        });
        
        return true;
      } else {
        Alert.alert('خطأ في الدفع', response.message || 'فشل في إنشاء طلب الدفع');
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'حدث خطأ أثناء محاولة الدفع';
      setError(errorMessage);
      Alert.alert('خطأ', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    initiatePayment
  };
};
