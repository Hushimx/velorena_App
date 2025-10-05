import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';

interface AppointmentSuccessBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  appointmentData?: {
    id: number;
    appointment_date: string;
    appointment_time: string;
    service_type: string;
    status: string;
  };
  orderData?: {
    id: number;
    status: string;
    total_amount: number;
  };
  onViewAppointments?: () => void;
  onViewOrders?: () => void;
  onDismiss?: () => void;
}

export default function AppointmentSuccessBottomSheet({
  bottomSheetRef,
  appointmentData,
  orderData,
  onViewAppointments,
  onViewOrders,
  onDismiss,
}: AppointmentSuccessBottomSheetProps) {
  const router = useRouter();
  const snapPoints = useMemo(() => ['85%'], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={() => {
          bottomSheetRef.current?.dismiss();
          if (onDismiss) {
            onDismiss();
          }
        }}
      />
    ),
    [bottomSheetRef, onDismiss]
  );

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
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'م' : 'ص';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleViewAppointments = () => {
    bottomSheetRef.current?.dismiss();
    if (onViewAppointments) {
      onViewAppointments();
    } else {
      router.push('/appointments');
    }
  };

  const handleViewOrders = () => {
    bottomSheetRef.current?.dismiss();
    if (onViewOrders) {
      onViewOrders();
    } else {
      router.push('/orders');
    }
  };

  const handleGoHome = () => {
    bottomSheetRef.current?.dismiss();
    router.push('/(tabs)');
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.successIconContainer}>
            <MaterialIcons name="check-circle" size={48} color={BRAND_COLORS.success} />
          </View>
          <Text style={styles.headerTitle}>تم حجز الموعد بنجاح!</Text>
          <Text style={styles.headerSubtitle}>
            تم تأكيد حجز موعدك وسيتم التواصل معك قريباً
          </Text>
        </View>

        {/* Appointment Details */}
        {appointmentData && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>تفاصيل الموعد</Text>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="event" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.detailLabel}>رقم الموعد:</Text>
              <Text style={styles.detailValue}>#{appointmentData.id}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="calendar-today" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.detailLabel}>التاريخ:</Text>
              <Text style={styles.detailValue}>{formatDate(appointmentData.appointment_date)}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="access-time" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.detailLabel}>الوقت:</Text>
              <Text style={styles.detailValue}>{formatTime(appointmentData.appointment_time)}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="design-services" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.detailLabel}>نوع الخدمة:</Text>
              <Text style={styles.detailValue}>{appointmentData.service_type}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="info" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.detailLabel}>الحالة:</Text>
              <Text style={[styles.detailValue, styles.pendingStatus]}>في انتظار التأكيد</Text>
            </View>
          </View>
        )}

        {/* Order Details */}
        {orderData && (
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>تفاصيل الطلب</Text>
            
            <View style={styles.detailItem}>
              <MaterialIcons name="shopping-cart" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.detailLabel}>رقم الطلب:</Text>
              <Text style={styles.detailValue}>#{orderData.id}</Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialIcons name="info" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.detailLabel}>الحالة:</Text>
              <Text style={[styles.detailValue, styles.waitingStatus]}>في انتظار الموعد</Text>
            </View>

            {orderData.total_amount > 0 && (
              <View style={styles.detailItem}>
                <MaterialIcons name="attach-money" size={20} color={BRAND_COLORS.primary} />
                <Text style={styles.detailLabel}>المبلغ الإجمالي:</Text>
                <Text style={styles.detailValue}>{orderData.total_amount} ريال</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewAppointments}
            activeOpacity={0.8}
          >
            <MaterialIcons name="event" size={20} color="white" />
            <Text style={styles.buttonText}>عرض المواعيد</Text>
          </TouchableOpacity>

          {orderData && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewOrders}
              activeOpacity={0.8}
            >
              <MaterialIcons name="shopping-cart" size={20} color={BRAND_COLORS.primary} />
              <Text style={styles.secondaryButtonText}>عرض الطلبات</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <MaterialIcons name="home" size={20} color={BRAND_COLORS.gray[600]} />
            <Text style={styles.homeButtonText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <MaterialIcons name="info-outline" size={16} color={BRAND_COLORS.info} />
          <Text style={styles.infoNoteText}>
            سيتم إرسال تفاصيل الموعد إلى رقم هاتفك المسجل
          </Text>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: SPACING.lg,
  },
  successIconContainer: {
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: BRAND_COLORS.success,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerSubtitle: {
    fontSize: 16,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  detailsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailLabel: {
    fontSize: 14,
    color: BRAND_COLORS.text.secondary,
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 14,
    color: BRAND_COLORS.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  pendingStatus: {
    color: BRAND_COLORS.warning,
  },
  waitingStatus: {
    color: BRAND_COLORS.info,
  },
  actionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  primaryButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  homeButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  secondaryButtonText: {
    color: BRAND_COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  homeButtonText: {
    color: BRAND_COLORS.gray[600],
    fontSize: 14,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: SPACING.sm,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 14,
    color: BRAND_COLORS.info,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});
