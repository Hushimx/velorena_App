import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import AppointmentSuccessBottomSheet from '../components/ui/AppointmentSuccessBottomSheet';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { createAppointment, createAppointmentFromCart } from '../utils/api';

const COLORS = {
  primary: BRAND_COLORS.primary,
  secondary: BRAND_COLORS.secondary,
  accent: BRAND_COLORS.accent,
  success: BRAND_COLORS.success,
  warning: BRAND_COLORS.warning,
  danger: BRAND_COLORS.error,
  info: BRAND_COLORS.info,
  light: BRAND_COLORS.background.tertiary,
  white: BRAND_COLORS.white,
  gray: BRAND_COLORS.gray,
};


export default function CreateAppointmentScreen() {
  const router = useRouter();
  const { selectedDate, selectedTime, orderId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuthStore();
  const { items: cartItems, cartDesigns, clear } = useCartStore();
  
  // Bottom sheet refs and state
  const successBottomSheetRef = useRef<BottomSheetModal>(null);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    appointment_date: selectedDate as string || '2025-01-20',
    appointment_time: selectedTime as string || '14:00',
    service_type: 'Interior Design Consultation',
    description: 'Need help with living room design',
    duration: 60,
    location: '123 Main St, City',
    notes: 'Please bring color samples',
    order_id: orderId ? parseInt(orderId as string) : undefined, // Use order ID from cart
    order_notes: orderId ? `موعد مرتبط بالطلب #${orderId}` : 'Related to order #123',
  });


  const handleBackNavigation = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/appointments');
      }
    } catch (error) {
      router.push('/appointments');
    }
  };

  const handleInputChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (value: string) => {
    // Remove any non-numeric characters except colon
    let formattedValue = value.replace(/[^\d:]/g, '');
    
    // Ensure only one colon
    const colonCount = (formattedValue.match(/:/g) || []).length;
    if (colonCount > 1) {
      formattedValue = formattedValue.replace(/:/g, '').replace(/(\d{2})(\d{2})/, '$1:$2');
    }
    
    // Auto-format as HH:MM
    if (formattedValue.length === 2 && !formattedValue.includes(':')) {
      formattedValue = formattedValue + ':';
    } else if (formattedValue.length === 4 && !formattedValue.includes(':')) {
      formattedValue = formattedValue.substring(0, 2) + ':' + formattedValue.substring(2);
    }
    
    // Limit to HH:MM format (5 characters max)
    if (formattedValue.length > 5) {
      formattedValue = formattedValue.substring(0, 5);
    }
    
    handleInputChange('appointment_time', formattedValue);
  };


  const handleSubmit = async () => {
    // Validation
    if (!formData.appointment_date || !formData.appointment_time || !formData.service_type) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Check authentication
    if (!token) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      router.push('/login');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.appointment_date)) {
      Alert.alert('خطأ', 'تنسيق التاريخ غير صحيح. يجب أن يكون YYYY-MM-DD');
      return;
    }

    // Validate date is today or in the future
    const appointmentDate = new Date(formData.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
    
    if (appointmentDate < today) {
      Alert.alert('خطأ', 'تاريخ الموعد يجب أن يكون اليوم أو في المستقبل');
      return;
    }

    // If appointment is for today, validate that time is in the future
    if (appointmentDate.getTime() === today.getTime()) {
      const now = new Date();
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}:00`);
      
      if (appointmentDateTime <= now) {
        Alert.alert('خطأ', 'وقت الموعد يجب أن يكون في المستقبل');
        return;
      }
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(formData.appointment_time)) {
      Alert.alert('خطأ', 'تنسيق الوقت غير صحيح. يجب أن يكون HH:MM');
      return;
    }

    setLoading(true);
    try {
      // Check if we have cart items - use createFromCart if we do
      const hasCartItems = (cartItems && cartItems.length > 0) || (cartDesigns && cartDesigns.length > 0);
      
      let result;
      
      if (hasCartItems) {
        // Create appointment with order from cart
        result = await createAppointmentFromCart({
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          service_type: formData.service_type,
          description: formData.description,
          duration: 60,
          location: formData.location || 'عن بُعد',
          notes: formData.notes,
        });
        
        // Clear cart after successful appointment creation
        clear();
      } else {
        // Create appointment without order (existing behavior)
        const appointmentData: any = {
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          service_type: formData.service_type,
          description: formData.description,
          duration: 60,
          location: formData.location || 'عن بُعد',
          notes: formData.notes,
        };

        // Only include order_id if it has a valid value
        if (formData.order_id && formData.order_id > 0) {
          appointmentData.order_id = formData.order_id;
        }
        
        result = await createAppointment(appointmentData);
      }
      
      
      // Set data for success bottom sheet
      setAppointmentData(result.data.appointment || result.data);
      if (result.data.order) {
        setOrderData(result.data.order);
      }
      
      // Show success bottom sheet instead of alert
      successBottomSheetRef.current?.present();
      
    } catch (error) {
      
      // Show more detailed error message
      let errorMessage = 'فشل في حجز الموعد. حاول مرة أخرى.';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific error types
        if (error.message.includes('404')) {
          errorMessage = 'خدمة المواعيد غير متاحة حالياً';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'غير مصرح لك بإنشاء موعد. تأكد من تسجيل الدخول';
        } else if (error.message.includes('422')) {
          errorMessage = 'البيانات المرسلة غير صحيحة. تحقق من جميع الحقول';
        } else if (error.message.includes('500')) {
          errorMessage = 'خطأ في الخادم. حاول مرة أخرى لاحقاً';
        } else if (error.message.includes('Selected order does not exist')) {
          errorMessage = 'رقم الطلب المحدد غير موجود. يرجى إزالة رقم الطلب أو استخدام رقم صحيح';
        }
      }
      
      const alertButtons: any[] = [
        { text: 'إلغاء', style: 'cancel' as const }
      ];

      // Add "Remove Order ID" button if the error is about order not existing
      if (errorMessage.includes('رقم الطلب المحدد غير موجود')) {
        alertButtons.splice(1, 0, {
          text: 'إزالة رقم الطلب',
          onPress: () => {
            setFormData(prev => ({ ...prev, order_id: undefined }));
            Alert.alert('تم', 'تم إزالة رقم الطلب. يمكنك المحاولة مرة أخرى');
          }
        });
      }

      Alert.alert('خطأ', errorMessage, alertButtons);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor={COLORS.white} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
          <MaterialIcons name="arrow-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>حجز موعد جديد</Text>
          {orderId && (
            <View style={styles.orderInfo}>
              <MaterialIcons name="shopping-cart" size={16} color={COLORS.primary} />
              <Text style={styles.orderInfoText}>مرتبط بالطلب #{orderId}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Info Card */}
        {orderId && (
          <View style={styles.orderInfoCard}>
            <View style={styles.orderInfoHeader}>
              <MaterialIcons name="shopping-cart" size={20} color={COLORS.primary} />
              <Text style={styles.orderInfoTitle}>حجز موعد مرتبط بالطلب</Text>
            </View>
            <Text style={styles.orderNumber}>طلب #{orderId}</Text>
            <Text style={styles.orderInfoNote}>
              سيتم ربط هذا الموعد بالطلب المحدد لتسهيل المتابعة
            </Text>
          </View>
        )}

        {/* Selected Appointment Info Card */}
        {(selectedDate || selectedTime) && (
          <View style={[styles.sectionCard, styles.selectedInfoCard]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="check-circle" size={24} color={COLORS.success} />
              <Text style={styles.sectionTitle}>الموعد المحدد</Text>
            </View>
            
            <View style={styles.selectedInfoContainer}>
              {selectedDate && (
                <View style={styles.selectedInfoItem}>
                  <MaterialIcons name="calendar-today" size={20} color={COLORS.success} />
                  <Text style={styles.selectedInfoLabel}>التاريخ:</Text>
                  <Text style={styles.selectedInfoValue}>{selectedDate}</Text>
                </View>
              )}
              
              {selectedTime && (
                <View style={styles.selectedInfoItem}>
                  <MaterialIcons name="access-time" size={20} color={COLORS.success} />
                  <Text style={styles.selectedInfoLabel}>الوقت:</Text>
                  <Text style={styles.selectedInfoValue}>{selectedTime}</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.changeDateButton}
              onPress={() => router.push({
                pathname: '/calendar',
                params: { 
                  hasCartItems: orderId ? 'true' : 'false',
                  cartItemCount: '1'
                }
              } as any)}
            >
              <MaterialIcons name="edit" size={16} color={COLORS.primary} />
              <Text style={styles.changeDateButtonText}>تغيير التاريخ</Text>
            </TouchableOpacity>
          </View>
        )}



        {/* Submit Button Card */}
        <View style={styles.submitCard}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <MaterialIcons name="event" size={20} color={COLORS.white} />
            <Text style={styles.submitButtonText}>
              {loading ? 'جاري الحجز...' : 'حجز الموعد'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.submitNote}>
            سيتم إرسال تأكيد الحجز إلى رقم هاتفك المسجل
          </Text>
        </View>
      </ScrollView>

      {/* Success Bottom Sheet */}
      <AppointmentSuccessBottomSheet
        bottomSheetRef={successBottomSheetRef}
        appointmentData={appointmentData}
        orderData={orderData}
        onViewAppointments={() => router.push('/appointments')}
        onViewOrders={() => router.push('/orders')}
        onDismiss={() => router.push('/(tabs)')}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    writingDirection: 'rtl',
  },
  
  // Header
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderInfoText: {
    fontSize: 12,
    color: COLORS.primary,
    marginRight: 4,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },

  // Order Info Card
  orderInfoCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  orderInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderInfoTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: SPACING.sm,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  orderInfoNote: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  primaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  secondaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  tertiaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: SPACING.sm,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Input Groups
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  inputHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[700],
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },


  // Submit Card
  submitCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  submitNote: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
  },

  // Selected Info Card
  selectedInfoCard: {
    backgroundColor: COLORS.success + '10',
    borderWidth: 2,
    borderColor: COLORS.success + '30',
  },
  selectedInfoContainer: {
    gap: SPACING.md,
  },
  selectedInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.success + '20',
  },
  selectedInfoLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  selectedInfoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.success,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  changeDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  changeDateButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
});
