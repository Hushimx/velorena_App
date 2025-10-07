import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentStatus } from '../utils/api';

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
  const { appointments, loading, hasMore, loadMore, reload, setFilter } = useAppointments();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

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

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleFilterChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'all') {
      setFilter({});
    } else {
      setFilter({ status: status as AppointmentStatus });
    }
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setFilter({});
    setShowFilterModal(false);
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
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7} onPress={handleFilterPress}>
            <MaterialIcons name="filter-list" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.newAppointmentButton} onPress={handleNewAppointment}>
            <MaterialIcons name="add" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
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
          // Debug logging for started appointments
          if (item.status === 'started') {
            console.log('🔍 Started Appointment:', {
              id: item.id,
              status: item.status,
              zoom_meeting_url: item.zoom_meeting_url,
              meeting: item.meeting,
              hasZoomUrl: !!item.zoom_meeting_url
            });
          }
          
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
                  
                  {/* Zoom Meeting Button for Started Appointments */}
                  {item.status === 'started' && item.zoom_meeting_url && (
                    <TouchableOpacity 
                      style={styles.zoomButton}
                      onPress={() => handleJoinMeeting(item.zoom_meeting_url!)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <MaterialIcons name="video-call" size={16} color={COLORS.white} />
                      </View>
                      <Text style={styles.zoomButtonText}>انضمام مباشر</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Filter Modal */}
      {showFilterModal && (
        <View style={styles.filterModal}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>تصفية المواعيد</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.filterModalClose}>
                <MaterialIcons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.filterOptions}
              contentContainerStyle={styles.filterOptionsContent}
              showsVerticalScrollIndicator={false}
            >
              {/* All Appointments Option */}
              <TouchableOpacity
                style={[styles.filterOption, styles.allOption, selectedStatus === 'all' && styles.filterOptionSelected]}
                onPress={() => handleFilterChange('all')}
              >
                <View style={styles.filterOptionContent}>
                  <MaterialIcons name="event" size={20} color={selectedStatus === 'all' ? COLORS.primary : COLORS.gray[600]} />
                  <Text style={[styles.filterOptionText, selectedStatus === 'all' && styles.filterOptionTextSelected]}>
                    جميع المواعيد
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Upcoming Appointments Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>المواعيد القادمة</Text>
                
                <TouchableOpacity
                  style={[styles.filterOption, selectedStatus === 'pending' && styles.filterOptionSelected]}
                  onPress={() => handleFilterChange('pending')}
                >
                  <View style={styles.filterOptionContent}>
                    <View style={[styles.statusIndicator, { backgroundColor: STATUS_COLOR.pending }]} />
                    <Text style={[styles.filterOptionText, selectedStatus === 'pending' && styles.filterOptionTextSelected]}>
                      {STATUS_LABEL.pending}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Completed Appointments Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>المواعيد المكتملة</Text>
                
                <TouchableOpacity
                  style={[styles.filterOption, selectedStatus === 'completed' && styles.filterOptionSelected]}
                  onPress={() => handleFilterChange('completed')}
                >
                  <View style={styles.filterOptionContent}>
                    <View style={[styles.statusIndicator, { backgroundColor: STATUS_COLOR.completed }]} />
                    <Text style={[styles.filterOptionText, selectedStatus === 'completed' && styles.filterOptionTextSelected]}>
                      {STATUS_LABEL.completed}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Cancelled Appointments Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>المواعيد الملغية</Text>
                
                <TouchableOpacity
                  style={[styles.filterOption, selectedStatus === 'cancelled' && styles.filterOptionSelected]}
                  onPress={() => handleFilterChange('cancelled')}
                >
                  <View style={styles.filterOptionContent}>
                    <View style={[styles.statusIndicator, { backgroundColor: STATUS_COLOR.cancelled }]} />
                    <Text style={[styles.filterOptionText, selectedStatus === 'cancelled' && styles.filterOptionTextSelected]}>
                      {STATUS_LABEL.cancelled}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.filterModalActions}>
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Text style={styles.clearFiltersText}>مسح الفلاتر</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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

  // Header Actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },

  // Filter Modal
  filterModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  filterModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
    width: '100%',
    ...SHADOWS.lg,
  },
  filterModalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  filterModalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  filterModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptions: {
    maxHeight: 300,
    flexGrow: 0,
  },
  filterOptionsContent: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  filterOption: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  allOption: {
    backgroundColor: COLORS.primary + '05',
    borderColor: COLORS.primary + '20',
    borderWidth: 1.5,
  },
  filterOptionSelected: {
    backgroundColor: COLORS.primary + '08',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  filterOptionContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.md,
  },
  filterOptionText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.gray[700],
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginRight: SPACING.md,
    textAlign: 'right',
  },
  filterOptionTextSelected: {
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  filterSection: {
    marginBottom: SPACING.xl,
  },
  filterSectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  filterModalActions: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    backgroundColor: COLORS.gray[50],
  },
  clearFiltersButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  clearFiltersText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  zoomButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...SHADOWS.sm,
  },
  zoomButtonText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff4444',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
});
