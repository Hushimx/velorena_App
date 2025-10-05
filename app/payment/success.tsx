import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Auto redirect to orders after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/orders' as any);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleGoToOrders = () => {
    router.replace('/orders' as any);
  };

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
        </View>

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleGoToOrders}>
            <Text style={styles.buttonText}>العودة للطلبات</Text>
          </TouchableOpacity>
        </View>

        {/* Auto Redirect Notice */}
        <Text style={styles.autoRedirectText}>
          سيتم توجيهك تلقائياً إلى صفحة الطلبات خلال 3 ثوانٍ
        </Text>
      </View>
    </SafeAreaView>
  );
}

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
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    writingDirection: 'rtl',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: SPACING.xl,
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
    writingDirection: 'rtl',
  },
  autoRedirectText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
