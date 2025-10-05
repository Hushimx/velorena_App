import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';

interface PaymentWebViewProps {
  paymentUrl: string;
  orderId: number;
  onSuccess?: (data: any) => void;
  onFailure?: (error: string) => void;
}

export const PaymentWebView = ({ paymentUrl, orderId, onSuccess, onFailure }: PaymentWebViewProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    
    // Check for success URL patterns
    if (url.includes('/payment/success') || 
        url.includes('status=success') || 
        url.includes('payment_status=success') ||
        url.includes('result=success')) {
      
      setShowSuccess(true);
      setPaymentData({
        orderId,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      if (onSuccess) {
        onSuccess({ orderId, success: true });
      }
    }
    
    // Check for failure URL patterns
    if (url.includes('/payment/failure') || 
        url.includes('status=failed') || 
        url.includes('payment_status=failed') ||
        url.includes('result=failed')) {
      
      const errorMessage = 'Payment failed. Please try again.';
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
    setError('Failed to load payment page. Please check your internet connection.');
    setLoading(false);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSuccessContinue = () => {
    // Navigate back to orders with refresh
    router.push({
      pathname: '/orders' as any,
      params: { 
        refresh: 'true', 
        timestamp: Date.now().toString(),
        paymentSuccess: 'true'
      }
    });
  };

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
