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

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Check for success URL patterns (Tap payment success)
    if (url.includes('/payment/success') || 
        url.includes('status=success') || 
        url.includes('payment_status=success') ||
        url.includes('result=success') ||
        url.includes('tap_id=') && url.includes('status=CAPTURED')) {
      
      // Wait a moment for webhook to process, then check actual payment status
      setCheckingPaymentStatus(true);
      setTimeout(async () => {
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
              // Payment was actually successful
              setShowSuccess(true);
              setPaymentData({
                orderId,
                success: true,
                timestamp: new Date().toISOString()
              });
              
              if (onSuccess) {
                onSuccess({ orderId, success: true });
              }
            } else {
              // Payment failed despite success URL
              setError('Payment failed. Please try again.');
              if (onFailure) {
                onFailure('Payment failed');
              }
            }
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // Show success anyway if status check fails
          setShowSuccess(true);
          setPaymentData({
            orderId,
            success: true,
            timestamp: new Date().toISOString()
          });
        } finally {
          setCheckingPaymentStatus(false);
        }
      }, 2000); // Wait 2 seconds for webhook to process
    }
    
    // Check for failure/cancel/error URL patterns
    if (url.includes('/payment/cancel') ||
        url.includes('/payment/failure') || 
        url.includes('/payment/error') ||
        url.includes('status=failed') || 
        url.includes('payment_status=failed') ||
        url.includes('result=failed') ||
        url.includes('error=') ||
        url.includes('tap_id=') && (url.includes('status=FAILED') || url.includes('status=CANCELLED'))) {
      
      let errorMessage = 'Payment failed. Please try again.';
      
      if (url.includes('/payment/cancel')) {
        errorMessage = 'Payment was cancelled.';
      } else if (url.includes('/payment/error')) {
        errorMessage = 'Payment error occurred.';
      } else if (url.includes('error=')) {
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
            <Text style={styles.title}>حدث خطأ</Text>
            <Text style={styles.subtitle}>{error}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleGoBack}>
              <Text style={styles.buttonText}>العودة</Text>
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
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.white,
    textAlign: 'center',
  },
});
