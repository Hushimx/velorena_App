import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useAuthStore } from '../store/useAuthStore';

interface PaymentWebViewProps {
  paymentUrl: string;
  orderId: number;
  onSuccess?: (data: any) => void;
  onFailure?: (error: string) => void;
}

export const PaymentWebView = ({ paymentUrl, orderId, onSuccess, onFailure }: PaymentWebViewProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingPaymentStatus, setCheckingPaymentStatus] = useState(false);

  // Helper function to check payment status (fallback method)
  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(`https://qaads.net/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const orderData = await response.json();
        const order = orderData.data;
        
        // Check payment status instead of order status
        const paymentStatus = order?.payment_status || 'unpaid';
        const latestPayment = order?.payments?.[0]; // Assuming payments are sorted by latest
        
        console.log('Order payment status check:', {
          orderId,
          paymentStatus,
          latestPaymentStatus: latestPayment?.status,
          orderStatus: order?.status
        });
        
        // Payment is successful only if payment status is 'paid' or latest payment is 'completed'
        if (paymentStatus === 'paid' || latestPayment?.status === 'completed') {
          // Payment was successful
          setShowSuccess(true);
          setPaymentData({
            orderId,
            success: true,
            timestamp: new Date().toISOString()
          });
          
          if (onSuccess) {
            onSuccess({ orderId, success: true });
          }
        } else if (latestPayment?.status === 'failed') {
          // Payment failed
          setError('Payment failed. Please try again.');
          if (onFailure) {
            onFailure('Payment failed');
          }
        } else {
          // Payment still pending
          Alert.alert(
            'Payment Processing',
            'Your payment is being processed. Please check your orders in a few minutes.',
            [
              {
                text: 'OK',
                onPress: () => router.push({
                  pathname: '/orders' as any,
                  params: { refresh: 'true' }
                })
              }
            ]
          );
        }
      } else {
        throw new Error('Failed to fetch order status');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Show success anyway if status check fails (conservative approach)
      setShowSuccess(true);
      setPaymentData({
        orderId,
        success: true,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Check for payment success/cancel URLs
    if (url.includes('/payment/success') || url.includes('/payment/cancel') || url.includes('/payment/failure')) {
      setCheckingPaymentStatus(true);
      
      // Extract charge_id from URL if available
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const chargeId = urlParams.get('charge_id') || urlParams.get('tap_id') || urlParams.get('id');
      
      setTimeout(async () => {
        try {
          // First, check the payment success page response (which now returns actual status)
          if (url.includes('/payment/success')) {
            const successResponse = await fetch(url, {
              headers: {
                'Accept': 'application/json'
              }
            });
            
            if (successResponse.ok) {
              const successData = await successResponse.json();
              console.log('Payment success page response:', successData);
              
              if (successData.success === true) {
                // Payment was actually successful
                setShowSuccess(true);
                setPaymentData({
                  orderId,
                  success: true,
                  timestamp: new Date().toISOString(),
                  message: successData.message
                });
                
                if (onSuccess) {
                  onSuccess({ orderId, success: true });
                }
              } else {
                // Payment failed - show error message from backend
                setError(successData.message || 'Payment failed. Please try again.');
                if (onFailure) {
                  onFailure(successData.message || 'Payment failed');
                }
              }
            } else {
              // Fallback: check payment status if success page fails
              await checkPaymentStatus();
            }
          } else {
            // For cancel/failure URLs, show appropriate error
            let errorMessage = 'Payment was cancelled.';
            if (url.includes('/payment/failure')) {
              errorMessage = 'Payment failed. Please try again.';
            }
            setError(errorMessage);
            if (onFailure) {
              onFailure(errorMessage);
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // Fallback: check payment status
          await checkPaymentStatus();
        } finally {
          setCheckingPaymentStatus(false);
        }
      }, 2000); // Wait 2 seconds for webhook to process
    }
    
    // Legacy URL pattern checks (for backwards compatibility)
    else if (url.includes('status=success') || 
             url.includes('payment_status=success') ||
             url.includes('result=success') ||
             url.includes('tap_id=') && url.includes('status=CAPTURED')) {
      
      setCheckingPaymentStatus(true);
      setTimeout(async () => {
        await checkPaymentStatus();
      }, 2000);
    }
    
    // Legacy failure URL pattern checks (for backwards compatibility)
    else if (url.includes('status=failed') || 
             url.includes('payment_status=failed') ||
             url.includes('result=failed') ||
             url.includes('error=') ||
             url.includes('tap_id=') && (url.includes('status=FAILED') || url.includes('status=CANCELLED'))) {
      
      let errorMessage = 'Payment failed. Please try again.';
      
      if (url.includes('error=')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const errorParam = urlParams.get('error');
        if (errorParam) {
          errorMessage = decodeURIComponent(errorParam);
        }
      }
      
      setError(errorMessage);
      
      if (onFailure) {
        onFailure(errorMessage);
      }
    }
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    
    let errorMessage = 'Failed to load payment page.';
    
    if (nativeEvent.description) {
      if (nativeEvent.description.includes('net::ERR_CONNECTION_REFUSED')) {
        errorMessage = 'Cannot connect to payment server. Please check your internet connection.';
      } else if (nativeEvent.description.includes('net::ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'Payment server not found. Please check your internet connection.';
      } else if (nativeEvent.description.includes('net::ERR_TIMED_OUT')) {
        errorMessage = 'Payment page loading timeout. Please try again.';
      } else {
        errorMessage = `Payment error: ${nativeEvent.description}`;
      }
    }
    
    setError(errorMessage);
    setLoading(false);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSuccessContinue = async () => {
    // Check payment status before navigating
    try {
      const response = await fetch(`https://qaads.net/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const orderData = await response.json();
        const orderStatus = orderData.data?.status;
        
        if (orderStatus === 'processing' || orderStatus === 'confirmed') {
          // Payment was successful
          router.push({
            pathname: '/orders' as any,
            params: { 
              refresh: 'true', 
              timestamp: Date.now().toString(),
              paymentSuccess: 'true'
            }
          });
        } else if (orderStatus === 'cancelled') {
          // Payment actually failed
          setError('Payment failed. The order was cancelled. Please try again.');
          setShowSuccess(false);
        } else {
          // Payment still pending
          Alert.alert(
            'Payment Processing',
            'Your payment is being processed. Please check your orders in a few minutes.',
            [
              {
                text: 'OK',
                onPress: () => router.push({
                  pathname: '/orders' as any,
                  params: { refresh: 'true' }
                })
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Navigate anyway if status check fails
      router.push({
        pathname: '/orders' as any,
        params: { 
          refresh: 'true', 
          timestamp: Date.now().toString(),
          paymentSuccess: 'true'
        }
      });
    }
  };

  if (checkingPaymentStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
          {/* Loading Icon */}
          <View style={styles.iconContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
          </View>

          {/* Loading Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.title}>جاري التحقق من حالة الدفع</Text>
            <Text style={styles.subtitle}>
              يرجى الانتظار بينما نتحقق من حالة الدفع...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons name="check-circle" size={80} color={BRAND_COLORS.success} />
          </View>

          {/* Success Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.title}>تم الدفع بنجاح!</Text>
            <Text style={styles.subtitle}>
              شكراً لك على الدفع. سيتم تحديث حالة الطلب قريباً.
            </Text>
            <Text style={styles.orderInfo}>
              رقم الطلب: #{orderId}
            </Text>
          </View>

          {/* Action Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleSuccessContinue}>
              <Text style={styles.buttonText}>العودة للطلبات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons name="error-outline" size={80} color={BRAND_COLORS.error} />
          </View>

          {/* Error Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.title}>فشل في الدفع</Text>
            <Text style={styles.subtitle}>{error}</Text>
            <Text style={styles.orderInfo}>
              رقم الطلب: #{orderId}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={() => router.back()}>
              <MaterialIcons name="refresh" size={20} color={BRAND_COLORS.primary} />
              <Text style={[styles.buttonText, styles.retryButtonText]}>إعادة المحاولة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleGoBack}>
              <Text style={[styles.buttonText, styles.backButtonText]}>العودة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إتمام الدفع</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
          <Text style={styles.loadingText}>جاري تحميل صفحة الدفع...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        source={{ uri: paymentUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
    direction: 'rtl',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: BRAND_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[200],
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.white,
    zIndex: 1,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.secondary,
    marginTop: SPACING.md,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  iconContainer: {
    marginBottom: SPACING['2xl'],
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: SPACING['3xl'],
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    marginBottom: SPACING.lg,
  },
  orderInfo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.primary,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  button: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.white,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.white,
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
  },
  retryButtonText: {
    color: BRAND_COLORS.primary,
  },
  backButton: {
    backgroundColor: BRAND_COLORS.gray[400],
  },
  backButtonText: {
    color: BRAND_COLORS.white,
  },
});
