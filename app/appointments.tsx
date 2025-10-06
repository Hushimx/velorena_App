import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentStatus } from '../utils/api';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

const COLORS = {
  primary: BRAND_COLORS.primary,
  secondary: BRAND_COLORS.secondary,
  accent: BRAND_COLORS.accent,
  white: BRAND_COLORS.white,
  light: BRAND_COLORS.background.tertiary,
  gray: BRAND_COLORS.gray,
  success: BRAND_COLORS.success,
  info: BRAND_COLORS.info,
  danger: BRAND_COLORS.error,
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  pending: '#fff3cd', // Soft yellow
  accepted: '#d4edda', // Soft green  
  rejected: '#f8d7da', // Soft red
  completed: '#d4edda', // Soft green
  cancelled: '#f8d7da', // Soft red
};

const STATUS_TEXT_COLOR: Record<AppointmentStatus, string> = {
  pending: '#856404', // Dark yellow
  accepted: '#155724', // Dark green
  rejected: '#721c24', // Dark red
  completed: '#155724', // Dark green
  cancelled: '#721c24', // Dark red
};

export default function Appointments() {
  const router = useRouter();
  const { appointments, loading, hasMore, loadMore, reload } = useAppointments();

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ar-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
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

  const onRefresh = () => {
    reload();
  };


  const handleNewAppointment = () => {
    // Navigate to create appointment form
    router.push('/create-appointment' as any);
  };

  const handleAppointmentPress = (appointmentId: number) => {
    router.push(`/appointment/${appointmentId}` as any);
  };

  return (
    <SafeAreaWrapper backgroundColor={COLORS.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>حجوزاتي</Text>
        <TouchableOpacity style={styles.newAppointmentButton} onPress={handleNewAppointment}>
          <MaterialIcons name="add" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>


      {/* List */}
      <FlatList
        data={appointments}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => hasMore && loadMore()}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>لا توجد حجوزات</Text>
            <Text style={styles.emptySubtitle}>ابدأ بحجز موعد جديد</Text>
          </View>
        ) : null}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>جاري التحميل...</Text>
            </View>
          ) : hasMore ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
              <Text style={styles.loadMoreText}>تحميل المزيد</Text>
            </TouchableOpacity>
          ) : appointments.length > 0 ? (
            <View style={styles.endMessage}>
              <Text style={styles.endMessageText}>تم عرض جميع الحجوزات</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          return (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => handleAppointmentPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>{item.service_type}</Text>
                  <Text style={styles.appointmentId}>#{item.id}</Text>
                  <Text style={styles.appointmentDate}>{formatDate(item.appointment_date)}</Text>
                    <Text style={styles.appointmentTime}>{formatTime(item.appointment_time)}</Text>
                </View>
                <View style={styles.appointmentRight}>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status as AppointmentStatus] }]}>
                    <Text style={[styles.statusText, { color: STATUS_TEXT_COLOR[item.status as AppointmentStatus] }]}>{STATUS_LABEL[item.status as AppointmentStatus]}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaWrapper>
  );
}


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.light,
    paddingTop: 44, // System status bar padding
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fefefe', // Soft white
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', // Soft gray border
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
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  newAppointmentButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  listContainer: { padding: SPACING.xl, paddingTop: SPACING.lg },
  card: {
    backgroundColor: '#fefefe', // Soft white
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Soft gray border
    ...SHADOWS.sm,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appointmentInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  appointmentTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize.lg,
  },
  appointmentId: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs / 2,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  appointmentDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    marginBottom: SPACING.xs / 2,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  appointmentTime: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  appointmentRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  loadingContainer: { 
    alignItems: 'center', 
    paddingVertical: SPACING['3xl'] 
  },
  loadingText: { 
    marginTop: SPACING.lg, 
    color: COLORS.gray[600], 
    fontSize: TYPOGRAPHY.fontSize.base, 
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  emptyContainer: { 
    alignItems: 'center', 
    paddingVertical: SPACING['6xl'], 
    paddingHorizontal: SPACING['4xl'] 
  },
  emptyTitle: { 
    fontSize: TYPOGRAPHY.fontSize['2xl'], 
    fontWeight: '700', 
    color: COLORS.gray[700], 
    marginBottom: SPACING.md, 
    textAlign: 'center', 
    writingDirection: 'rtl', 
    fontFamily: TYPOGRAPHY.fontFamily.bold 
  },
  emptySubtitle: { 
    fontSize: TYPOGRAPHY.fontSize.lg, 
    color: COLORS.gray[500], 
    textAlign: 'center', 
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.lg, 
    writingDirection: 'rtl', 
    fontFamily: TYPOGRAPHY.fontFamily.regular 
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['3xl'],
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.sm,
  },
  loadMoreText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.white,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  endMessage: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  endMessageText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[500],
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});
