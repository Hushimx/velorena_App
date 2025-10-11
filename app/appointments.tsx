import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useAppointments } from '../hooks/useAppointments';

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

const STATUS_CONFIG = {
  pending: { 
    color: '#fff3cd', 
    text: 'قيد الانتظار', 
    textColor: '#856404',
    bgColor: '#fef9e7',
    borderColor: '#f9e79f'
  },
  accepted: { 
    color: '#d4edda', 
    text: 'مقبول', 
    textColor: '#155724',
    bgColor: '#f0f9f0',
    borderColor: '#a8d5a8'
  },
  started: { 
    color: '#d1ecf1', 
    text: 'تم البدء', 
    textColor: '#0c5460',
    bgColor: '#f0f8ff',
    borderColor: '#a8d8e8'
  },
  rejected: { 
    color: '#f8d7da', 
    text: 'مرفوض', 
    textColor: '#721c24',
    bgColor: '#fef2f2',
    borderColor: '#f5b7b1'
  },
  completed: { 
    color: '#d4edda', 
    text: 'مكتمل', 
    textColor: '#155724',
    bgColor: '#f0f9f0',
    borderColor: '#a8d5a8'
  },
  cancelled: { 
    color: '#f8d7da', 
    text: 'ملغي', 
    textColor: '#721c24',
    bgColor: '#fef2f2',
    borderColor: '#f5b7b1'
  },
};

export default function Appointments() {
  const router = useRouter();
  const { appointments, loading, hasMore, loadMore, reload } = useAppointments();

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

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

  const handleAppointmentPress = (appointmentId: number) => {
    router.push(`/appointment/${appointmentId}` as any);
  };

  const handleJoinMeeting = (zoomUrl: string) => {
    Alert.alert(
      'انضمام للاجتماع',
      'هل تريد الانضمام للاجتماع؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'انضمام',
          onPress: () => {
            Linking.openURL(zoomUrl);
          }
        }
      ]
    );
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
          <MaterialIcons name="arrow-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>حجوزاتي</Text>
        </View>
        <View style={styles.headerSpacer} />
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
        renderItem={({ item, index }) => {
          const statusConfig = getStatusConfig(item.status);
          const isFirst = index === 0;
          const isLast = index === appointments.length - 1;
          
          return (
            <TouchableOpacity 
              style={[
                styles.card,
                isFirst && styles.firstCard,
                isLast && styles.lastCard
              ]}
              onPress={() => handleAppointmentPress(item.id)}
              activeOpacity={0.7}
            >
              {/* Appointment Header */}
              <View style={styles.appointmentHeader}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentNumber}>موعد #{item.id}</Text>
                  <Text style={styles.appointmentTitle} numberOfLines={2}>{item.service_type}</Text>
                </View>
              </View>

              {/* Date and Time Row */}
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                  <MaterialIcons name="event" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.dateTimeText}>{formatDate(item.appointment_date)}</Text>
                </View>
                <View style={styles.dateTimeItem}>
                  <MaterialIcons name="access-time" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.dateTimeText}>{formatTime(item.appointment_time)}</Text>
                </View>
              </View>

              {/* Status and Actions Row */}
              <View style={styles.statusActionsRow}>
                <View style={[
                  styles.statusBadge, 
                  { 
                    backgroundColor: statusConfig.bgColor,
                    borderColor: statusConfig.borderColor
                  }
                ]}>
                  <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                    {statusConfig.text}
                  </Text>
                </View>
                
                {/* Zoom Meeting Button for Started Appointments */}
                {item.status === 'started' && item.zoom_meeting_url && (
                  <TouchableOpacity 
                    style={styles.zoomButton}
                    onPress={() => handleJoinMeeting(item.zoom_meeting_url!)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <MaterialIcons name="video-call" size={18} color={COLORS.white} />
                    </View>
                    <Text style={styles.zoomButtonText}>انضمام للاجتماع</Text>
                  </TouchableOpacity>
                )}
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
    backgroundColor: COLORS.white,
    writingDirection: 'rtl',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerSpacer: {
    width: 40,
  },
  listContainer: { 
    padding: SPACING.lg, 
    paddingTop: SPACING.md 
  },
  firstCard: {
    marginTop: SPACING.xs,
  },
  lastCard: {
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.md,
  },
  appointmentHeader: {
    marginBottom: SPACING.md,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs / 2,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'right',
  },
  appointmentTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize.lg,
    paddingVertical: SPACING.xs,
    textAlign: 'right',
  },
  dateTimeRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: SPACING.xl,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  dateTimeItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  dateTimeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray[700],
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontWeight: '600',
  },
  statusActionsRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    minWidth: 110,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    letterSpacing: 0.3,
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

  zoomButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.md,
  },
  zoomButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: '700',
  },
  liveIndicator: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 3,
  },
});
