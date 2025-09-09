import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentStatus } from '../utils/api';

const COLORS = {
  primary: '#2a1e1e',
  secondary: '#ffde9f',
  white: '#ffffff',
  light: '#f8fafc',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
  },
  success: '#10b981',
  info: '#1e40af',
  danger: '#ef4444',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  pending: COLORS.info,
  accepted: COLORS.success,
  rejected: COLORS.danger,
  completed: COLORS.success,
  cancelled: COLORS.danger,
};

export default function Appointments() {
  const router = useRouter();
  const { appointments, loading, hasMore, loadMore, setFilter, params, reload } = useAppointments();
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<AppointmentStatus | undefined>(undefined);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const matchesStatus = activeStatus ? a.status === activeStatus : true;
      const q = search.trim();
      const matchesSearch = q
        ? [a.service_type, a.description ?? '', a.notes ?? '', a.designer_name ?? '']
            .join(' ')
            .toLowerCase()
            .includes(q.toLowerCase())
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [appointments, activeStatus, search]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ar-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  const onRefresh = () => {
    reload();
  };

  const handleCancel = (id: number) => {
    Alert.alert('إلغاء الموعد', 'هل أنت متأكد من إلغاء هذا الموعد؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم', style: 'destructive', onPress: () => {
        // TODO: Implement cancel appointment API call
        Alert.alert('تم الإلغاء', 'تم إلغاء الموعد بنجاح');
        reload();
      }},
    ]);
  };

  const handleReschedule = (id: number) => {
    Alert.alert('تعديل الموعد', 'سيتم إضافة شاشة إعادة الجدولة لاحقاً.');
  };

  const handleNewAppointment = () => {
    // Navigate to create appointment form
    router.push('/create-appointment' as any);
  };

  const handleAppointmentPress = (appointmentId: number) => {
    router.push(`/appointment/${appointmentId}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>حجوزاتي</Text>
            <Text style={styles.headerSubtitle}>إدارة مواعيدك القادمة والسابقة</Text>
          </View>
          <TouchableOpacity style={styles.newAppointmentButton} onPress={handleNewAppointment}>
            <MaterialIcons name="add" size={20} color={COLORS.white} />
            <Text style={styles.newAppointmentButtonText}>حجز جديد</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="ابحث عن موعد..."
            placeholderTextColor={COLORS.gray[400]}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          <ScrollChips
            items={[
              { key: 'all', label: 'الكل', active: !activeStatus, onPress: () => setActiveStatus(undefined) },
              { key: 'pending', label: STATUS_LABEL.pending, active: activeStatus === 'pending', onPress: () => setActiveStatus('pending') },
              { key: 'accepted', label: STATUS_LABEL.accepted, active: activeStatus === 'accepted', onPress: () => setActiveStatus('accepted') },
              { key: 'completed', label: STATUS_LABEL.completed, active: activeStatus === 'completed', onPress: () => setActiveStatus('completed') },
              { key: 'cancelled', label: STATUS_LABEL.cancelled, active: activeStatus === 'cancelled', onPress: () => setActiveStatus('cancelled') },
            ]}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
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
            <Text style={styles.emptySubtitle}>{search || activeStatus ? 'جرّب تغيير البحث أو الفلاتر' : 'ابدأ بحجز موعد جديد'}</Text>
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
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status as AppointmentStatus] }]}>
                    <Text style={styles.statusText}>{STATUS_LABEL[item.status as AppointmentStatus]}</Text>
                  </View>
                </View>
                <View style={styles.cardHeaderRight}>
                  <Text style={styles.serviceName}>{item.service_type}</Text>
                  <Text style={styles.providerName}>{item.designer_name || 'مصمم'}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.rowBetween}>
                  <Text style={styles.detailLabel}>التاريخ</Text>
                  <Text style={styles.detailValue}>{formatDate(item.appointment_date)}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.detailLabel}>الوقت</Text>
                  <Text style={styles.detailValue}>{item.appointment_time}</Text>
                </View>
                {item.duration && (
                  <View style={styles.rowBetween}>
                    <Text style={styles.detailLabel}>المدة</Text>
                    <Text style={styles.detailValue}>{item.duration} دقيقة</Text>
                  </View>
                )}
                {item.location && (
                  <View style={styles.rowBetween}>
                    <Text style={styles.detailLabel}>المكان</Text>
                    <Text style={styles.detailValue}>{item.location}</Text>
                  </View>
                )}
                {item.description ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText} numberOfLines={3}>{item.description}</Text>
                  </View>
                ) : null}
                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText} numberOfLines={3}>{item.notes}</Text>
                  </View>
                ) : null}
                {item.order_notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText} numberOfLines={3}>ملاحظات الطلب: {item.order_notes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                {item.status === 'pending' || item.status === 'accepted' ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={() => handleReschedule(item.id)}>
                      <Text style={styles.primaryButtonText}>تعديل الموعد</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={() => handleCancel(item.id)}>
                      <Text style={styles.outlineButtonText}>إلغاء</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.actionsRowCentered}>
                    <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleNewAppointment}>
                      <Text style={styles.primaryButtonText}>حجز جديد</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

function ScrollChips({ items }: { items: Array<{ key: string; label: string; active: boolean; onPress: () => void; }> }) {
  return (
    <View style={styles.chipsRow}>
      {items.map((chip) => (
        <TouchableOpacity
          key={chip.key}
          onPress={chip.onPress}
          style={[styles.chip, chip.active && styles.chipActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipText, chip.active && styles.chipTextActive]}>{chip.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'right',
    marginBottom: 4,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  newAppointmentButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newAppointmentButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  searchSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[700],
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  filtersRow: { marginTop: 4 },
  chipsRow: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  chipTextActive: { color: COLORS.white },
  listContainer: { padding: 20, paddingTop: 16 },
  card: {
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardHeaderLeft: { justifyContent: 'center', alignItems: 'center' },
  cardHeaderRight: { flex: 1, alignItems: 'flex-end' },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },
  providerName: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  cardBody: { marginTop: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'left',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  notesBox: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  notesText: {
    fontSize: 13,
    color: COLORS.gray[600],
    textAlign: 'right',
    lineHeight: 18,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  cardFooter: { marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.gray[200], paddingTop: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionsRowCentered: { flexDirection: 'row', justifyContent: 'center' },
  button: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, minWidth: 120, alignItems: 'center' },
  primaryButton: { backgroundColor: COLORS.primary, borderWidth: 1, borderColor: COLORS.primary },
  primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '700', fontFamily: 'NotoSansArabic_700Bold' },
  outlineButton: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary },
  outlineButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: '700', fontFamily: 'NotoSansArabic_700Bold' },
  loadingContainer: { alignItems: 'center', paddingVertical: 24 },
  loadingText: { marginTop: 10, color: COLORS.gray[600], fontSize: 16, fontFamily: 'NotoSansArabic_400Regular' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.gray[700], marginBottom: 8, textAlign: 'center', writingDirection: 'rtl', fontFamily: 'NotoSansArabic_700Bold' },
  emptySubtitle: { fontSize: 16, color: COLORS.gray[500], textAlign: 'center', lineHeight: 24, writingDirection: 'rtl', fontFamily: 'NotoSansArabic_400Regular' },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  endMessage: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  endMessageText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
});
