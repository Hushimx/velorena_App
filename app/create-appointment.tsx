import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { createAppointment } from '../utils/api';

const COLORS = {
  primary: '#2a1e1e',
  secondary: '#ffde9f',
  white: '#ffffff',
  light: '#f8fafc',
  gray: {
    50: '#f8fafc',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
  },
  success: '#10b981',
  danger: '#ef4444',
};

const SERVICE_TYPES = [
  'استشارة تصميم داخلي',
  'استشارة تصميم خارجي',
  'متابعة مشروع',
  'عرض منتجات',
  'استشارة ألوان',
  'استشارة أثاث',
];

const DURATION_OPTIONS = [30, 60, 90, 120];

export default function CreateAppointmentScreen() {
  const router = useRouter();
  const { selectedDate, selectedTime, orderId } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuthStore();
  
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
      console.log('Navigation error, going to appointments:', error);
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


    console.log('Auth status:', { token: !!token, user: user?.full_name });
    console.log('Date validation:', { 
      date: formData.appointment_date, 
      isValidDate: dateRegex.test(formData.appointment_date),
      time: formData.appointment_time,
      isValidTime: timeRegex.test(formData.appointment_time)
    });

    setLoading(true);
    try {
      // Create appointment data without designer_id
      const appointmentData: any = {
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        service_type: formData.service_type,
        description: formData.description,
        duration: 60, // Default 60 minutes
        location: formData.location || 'عن بُعد',
        notes: formData.notes,
      };

      // Only include order_id if it has a valid value
      if (formData.order_id && formData.order_id > 0) {
        appointmentData.order_id = formData.order_id;
      }
      
      console.log('🔍 Creating appointment with payload:', appointmentData);
      const result = await createAppointment(appointmentData);
      console.log('✅ Appointment created successfully:', result);
      
      Alert.alert('تم الحجز', 'تم حجز موعدك بنجاح!', [
        { text: 'موافق', onPress: () => router.push('/appointments') }
      ]);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التاريخ والوقت</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>التاريخ *</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, styles.inputWithButtonText]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.gray[400]}
                value={formData.appointment_date}
                onChangeText={(value) => handleInputChange('appointment_date', value)}
              />
              <TouchableOpacity 
                style={styles.calendarButton}
                onPress={() => router.push({
                  pathname: '/calendar',
                  params: { mode: 'select' }
                } as any)}
              >
                <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              يمكن أن يكون التاريخ اليوم أو في المستقبل
            </Text>
            {selectedDate && (
              <Text style={styles.selectedInfoText}>
                ✓ تم اختيار التاريخ من التقويم
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الوقت *</Text>
            <TextInput
              style={styles.input}
              placeholder="HH:MM (مثل: 14:30)"
              placeholderTextColor={COLORS.gray[400]}
              value={formData.appointment_time}
              onChangeText={handleTimeChange}
              keyboardType="numeric"
              maxLength={5}
            />
            <Text style={styles.inputHint}>
              أدخل الوقت بصيغة 24 ساعة (مثل: 14:30)
            </Text>
            {selectedTime && (
              <Text style={styles.selectedInfoText}>
                ✓ تم اختيار الوقت من التقويم
              </Text>
            )}
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل الخدمة</Text>
          
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نوع الخدمة *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {SERVICE_TYPES.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.chip,
                    formData.service_type === service && styles.chipSelected
                  ]}
                  onPress={() => handleInputChange('service_type', service)}
                >
                  <Text style={[
                    styles.chipText,
                    formData.service_type === service && styles.chipTextSelected
                  ]}>
                    {service}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>المدة (دقيقة)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
              {DURATION_OPTIONS.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.chip,
                    formData.duration === duration && styles.chipSelected
                  ]}
                  onPress={() => handleInputChange('duration', duration)}
                >
                  <Text style={[
                    styles.chipText,
                    formData.duration === duration && styles.chipTextSelected
                  ]}>
                    {duration} دقيقة
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الوصف</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="وصف الخدمة المطلوبة..."
              placeholderTextColor={COLORS.gray[400]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Location and Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات إضافية</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>المكان</Text>
            <TextInput
              style={styles.input}
              placeholder="عن بُعد أو عنوان محدد"
              placeholderTextColor={COLORS.gray[400]}
              value={formData.location}
              onChangeText={(value) => handleInputChange('location', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ملاحظات</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="أي ملاحظات إضافية..."
              placeholderTextColor={COLORS.gray[400]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم الطلب</Text>
            <TextInput
              style={styles.input}
              placeholder="رقم الطلب المرتبط (اختياري - اتركه فارغاً إذا لم يكن لديك طلب)"
              placeholderTextColor={COLORS.gray[400]}
              value={formData.order_id?.toString() || ''}
              onChangeText={(value) => handleInputChange('order_id', value ? parseInt(value) : undefined)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ملاحظات الطلب</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="ملاحظات إضافية حول الطلب..."
              placeholderTextColor={COLORS.gray[400]}
              value={formData.order_notes}
              onChangeText={(value) => handleInputChange('order_notes', value)}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Submit Button */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[300],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
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
    marginLeft: 4,
    fontFamily: 'NotoSansArabic_500Medium',
  },

  // Content
  content: {
    padding: 20,
  },

  // Sections
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },

  // Input Groups
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.gray[700],
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    paddingRight: 16,
  },
  inputWithButtonText: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingRight: 0,
  },
  calendarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
  },
  selectedInfoText: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.gray[700],
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  chipTextSelected: {
    color: COLORS.white,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },

  // Submit Button
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
});
