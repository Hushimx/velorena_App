import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { Appointment, AppointmentStatus, deleteAppointment, getAppointmentDetails, updateAppointment } from '../../utils/api';

const COLORS = {
  primary: BRAND_COLORS.primary,
  secondary: BRAND_COLORS.secondary,
  white: BRAND_COLORS.white,
  light: BRAND_COLORS.background.tertiary,
  gray: BRAND_COLORS.gray,
  success: BRAND_COLORS.success,
  danger: BRAND_COLORS.error,
  warning: BRAND_COLORS.warning,
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'في الانتظار',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  started: 'تم البدء',
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  pending: COLORS.warning,
  accepted: COLORS.success,
  rejected: COLORS.danger,
  completed: COLORS.success,
  cancelled: COLORS.danger,
  started: COLORS.primary,
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

export default function AppointmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_time: '',
    service_type: '',
    description: '',
    duration: 60,
    location: '',
    notes: '',
    order_id: undefined as number | undefined,
    order_notes: '',
  });

  const loadAppointmentDetails = async (showRefresh = false) => {
    if (!id) return;
    
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await getAppointmentDetails(Number(id));
      const appointmentData = response.data;
      setAppointment(appointmentData);
      
      // Populate form data for editing
      setFormData({
        appointment_date: appointmentData.appointment_date,
        appointment_time: appointmentData.appointment_time,
        service_type: appointmentData.service_type,
        description: appointmentData.description || '',
        duration: appointmentData.duration || 60,
        location: appointmentData.location || '',
        notes: appointmentData.notes || '',
        order_id: appointmentData.order_id,
        order_notes: appointmentData.order_notes || '',
      });
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل تفاصيل الموعد');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointmentDetails();
  }, [id]);

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

  const handleCancelAppointment = async () => {
    if (!appointment) return;
    
    Alert.alert(
      'إلغاء الموعد',
      'هل أنت متأكد من إلغاء هذا الموعد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد الإلغاء',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deleteAppointment(appointment.id);
              Alert.alert('تم الإلغاء', 'تم إلغاء الموعد بنجاح', [
                { text: 'موافق', onPress: () => router.push('/appointments') }
              ]);
            } catch (error) {
              Alert.alert('خطأ', 'فشل في إلغاء الموعد');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRescheduleAppointment = () => {
    Alert.alert('إعادة الجدولة', 'سيتم إضافة ميزة إعادة الجدولة قريباً');
  };

  const handleJoinMeeting = () => {
    if (!appointment?.zoom_meeting_url) {
      Alert.alert('خطأ', 'رابط الاجتماع غير متاح');
      return;
    }

    Alert.alert(
      'انضمام للاجتماع',
      'هل تريد الانضمام للاجتماع؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'انضمام',
          onPress: () => {
            // Open the meeting URL in the device's default browser
            Linking.openURL(appointment.zoom_meeting_url);
          }
        }
      ]
    );
  };

  const handleEditAppointment = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (appointment) {
      // Reset form data to original values
      setFormData({
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        service_type: appointment.service_type,
        description: appointment.description || '',
        duration: appointment.duration || 60,
        location: appointment.location || '',
        notes: appointment.notes || '',
        order_id: appointment.order_id,
        order_notes: appointment.order_notes || '',
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string | number) => {
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

  const handleUpdateAppointment = async () => {
    if (!appointment) return;

    // Validation
    if (!formData.appointment_date || !formData.appointment_time || !formData.service_type) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
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


    setActionLoading(true);
    try {
      // Ensure proper data types and formats
      const updateData = {
        ...formData,
        order_id: formData.order_id ? Number(formData.order_id) : undefined,
        // Ensure time is in HH:MM format
        appointment_time: formData.appointment_time,
        // Ensure date is in YYYY-MM-DD format
        appointment_date: formData.appointment_date,
      };

      
      await updateAppointment(appointment.id, updateData);
      Alert.alert('تم التحديث', 'تم تحديث الموعد بنجاح!', [
        { text: 'موافق', onPress: () => {
          setIsEditing(false);
          loadAppointmentDetails();
        }}
      ]);
    } catch (error) {
      
      // Show more detailed error message
      let errorMessage = 'فشل في تحديث الموعد. حاول مرة أخرى.';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific error types
        if (error.message.includes('valid time format')) {
          errorMessage = 'تنسيق الوقت غير صحيح. يجب أن يكون HH:MM (مثل: 14:30)';
        } else if (error.message.includes('valid date format')) {
          errorMessage = 'تنسيق التاريخ غير صحيح. يجب أن يكون YYYY-MM-DD';
        } else if (error.message.includes('422')) {
          errorMessage = 'البيانات المرسلة غير صحيحة. تحقق من جميع الحقول';
        }
      }
      
      Alert.alert('خطأ', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (timeString: string) => {
    try {
      // Handle ISO datetime format: "2025-09-13T08:00:00.000000Z"
      let date;
      if (timeString.includes('T')) {
        date = new Date(timeString);
      } else if (timeString.includes(':')) {
        // Handle simple time format: "14:30"
        const [hours, minutes] = timeString.split(':');
        date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        return timeString;
      }
      
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'م' : 'ص';
      const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>جاري تحميل تفاصيل الموعد...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.gray[400]} />
          <Text style={styles.errorTitle}>لم يتم العثور على الموعد</Text>
          <Text style={styles.errorMessage}>الموعد المطلوب غير موجود أو تم حذفه</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadAppointmentDetails()}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={COLORS.white} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
          <MaterialIcons name="arrow-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الموعد</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAppointmentDetails(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[appointment.status as AppointmentStatus] }]}>
              <Text style={styles.statusText}>
                {STATUS_LABEL[appointment.status as AppointmentStatus]}
              </Text>
            </View>
            <Text style={styles.appointmentId}># {appointment.id}</Text>
          </View>
        </View>

        {/* Appointment Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>معلومات الموعد</Text>
            {(appointment.status === 'pending' || appointment.status === 'accepted') && !isEditing && (
              <TouchableOpacity style={styles.editButton} onPress={handleEditAppointment}>
                <MaterialIcons name="edit" size={20} color={COLORS.primary} />
                <Text style={styles.editButtonText}>تعديل</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {isEditing ? (
            // Edit Form
            <View style={styles.editForm}>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>التاريخ *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.gray[400]}
                  value={formData.appointment_date}
                  onChangeText={(value) => handleInputChange('appointment_date', value)}
                />
                <Text style={styles.inputHint}>
                  يمكن أن يكون التاريخ اليوم أو في المستقبل
                </Text>
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
              </View>

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
                <Text style={styles.inputLabel}>ملاحظات الطلب</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="ملاحظات متعلقة بالطلب..."
                  placeholderTextColor={COLORS.gray[400]}
                  value={formData.order_notes}
                  onChangeText={(value) => handleInputChange('order_notes', value)}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          ) : (
            // Read-only View
            <>
              <View style={styles.infoRow}>
                <MaterialIcons name="event" size={20} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>التاريخ</Text>
                  <Text style={styles.infoValue}>{formatDate(appointment.appointment_date)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="access-time" size={20} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>الوقت</Text>
                  <Text style={styles.infoValue}>{formatTime(appointment.appointment_time)}</Text>
                </View>
              </View>


              <View style={styles.infoRow}>
                <MaterialIcons name="work" size={20} color={COLORS.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>نوع الخدمة</Text>
                  <Text style={styles.infoValue}>{appointment.service_type}</Text>
                </View>
              </View>

              {appointment.duration && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>المدة</Text>
                    <Text style={styles.infoValue}>{appointment.duration} دقيقة</Text>
                  </View>
                </View>
              )}

              {appointment.location && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>المكان</Text>
                    <Text style={styles.infoValue}>{appointment.location}</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Description */}
        {appointment.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الوصف</Text>
            <Text style={styles.descriptionText}>{appointment.description}</Text>
          </View>
        )}

        {/* Notes */}
        {appointment.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ملاحظات</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        )}

        {/* Order Notes */}
        {appointment.order_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ملاحظات الطلب</Text>
            <Text style={styles.notesText}>{appointment.order_notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          {isEditing ? (
            // Edit Mode Actions
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]} 
                onPress={handleUpdateAppointment}
                disabled={actionLoading}
              >
                <MaterialIcons name="save" size={20} color={COLORS.white} />
                <Text style={styles.actionButtonText}>
                  {actionLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelEditButton]} 
                onPress={handleCancelEdit}
                disabled={actionLoading}
              >
                <MaterialIcons name="close" size={20} color={COLORS.gray[600]} />
                <Text style={[styles.actionButtonText, styles.cancelEditButtonText]}>
                  إلغاء التعديل
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            // Read Mode Actions
            <>
              {/* Join Meeting Button - Show when appointment is started */}
              {appointment.status === 'started' && appointment.zoom_meeting_url && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.joinMeetingButton]} 
                  onPress={handleJoinMeeting}
                >
                  <MaterialIcons name="video-call" size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>
                    انضمام للاجتماع
                  </Text>
                </TouchableOpacity>
              )}

              {(appointment.status === 'pending' || appointment.status === 'accepted') && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]} 
                  onPress={handleCancelAppointment}
                  disabled={actionLoading}
                >
                  <MaterialIcons name="cancel" size={20} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>
                    {actionLoading ? 'جاري الإلغاء...' : 'إلغاء الموعد'}
                  </Text>
                </TouchableOpacity>
              )}

              {appointment.status === 'pending' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.rescheduleButton]} 
                  onPress={handleRescheduleAppointment}
                >
                  <MaterialIcons name="schedule" size={20} color={COLORS.primary} />
                  <Text style={[styles.actionButtonText, styles.rescheduleButtonText]}>
                    إعادة الجدولة
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Soft gray border
    backgroundColor: '#fefefe', // Soft white
    ...SHADOWS.sm,
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
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerSpacer: {
    width: 44,
  },

  // Content
  content: {
    padding: SPACING.xl,
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginTop: SPACING.lg,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
    ...SHADOWS.sm,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Status Card
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  statusText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  appointmentId: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Sections
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.secondary,
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },

  // Info Rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 4,
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.gray[700],
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },

  // Text Content
  descriptionText: {
    fontSize: 16,
    color: COLORS.gray[700],
    lineHeight: 24,
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  notesText: {
    fontSize: 16,
    color: COLORS.gray[600],
    lineHeight: 24,
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_400Regular',
  },

  // Edit Form
  editForm: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
    textAlign: 'right',
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
    fontFamily: 'NotoSansArabic_400Regular',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
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
    fontFamily: 'NotoSansArabic_400Regular',
  },
  chipTextSelected: {
    color: COLORS.white,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },

  // Actions
  actionsSection: {
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
  },
  rescheduleButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  joinMeetingButton: {
    backgroundColor: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.success,
  },
  cancelEditButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  rescheduleButtonText: {
    color: COLORS.primary,
  },
  cancelEditButtonText: {
    color: COLORS.gray[600],
  },
});
