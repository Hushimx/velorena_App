import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useSupportStore } from '../store/useSupportStore';
import { SupportTicket, SupportTicketCategory, SupportTicketPriority, SupportTicketStatus } from '../utils/api';

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    tickets,
    ticketsLoading,
    ticketsError,
    ticketsPagination,
    statistics,
    statisticsLoading,
    fetchTickets,
    fetchStatistics,
    setFilters
  } = useSupportStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | SupportTicketStatus>('all');

  useEffect(() => {
    fetchTickets();
    fetchStatistics();
  }, [fetchTickets, fetchStatistics]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTickets({ page: 1 }),
      fetchStatistics()
    ]);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (ticketsPagination?.has_more_pages && !ticketsLoading) {
      fetchTickets({ page: (ticketsPagination.current_page || 1) + 1 }, true);
    }
  };

  const handleFilterChange = (filter: 'all' | SupportTicketStatus) => {
    setSelectedFilter(filter);
    const params = filter === 'all' ? {} : { status: filter };
    setFilters(params);
    fetchTickets({ ...params, page: 1 });
  };

  const getStatusColor = (status: SupportTicketStatus) => {
    switch (status) {
      case 'open': return BRAND_COLORS.info;
      case 'in_progress': return BRAND_COLORS.warning;
      case 'pending': return BRAND_COLORS.gray[500];
      case 'resolved': return BRAND_COLORS.success;
      case 'closed': return BRAND_COLORS.gray[600];
      default: return BRAND_COLORS.gray[500];
    }
  };

  const getPriorityColor = (priority: SupportTicketPriority) => {
    switch (priority) {
      case 'urgent': return BRAND_COLORS.error;
      case 'high': return '#ff6b35';
      case 'medium': return BRAND_COLORS.warning;
      case 'low': return BRAND_COLORS.success;
      default: return BRAND_COLORS.gray[500];
    }
  };

  const getStatusText = (status: SupportTicketStatus) => {
    switch (status) {
      case 'open': return 'مفتوح';
      case 'in_progress': return 'قيد المعالجة';
      case 'pending': return 'في الانتظار';
      case 'resolved': return 'تم الحل';
      case 'closed': return 'مغلق';
      default: return status;
    }
  };

  const getPriorityText = (priority: SupportTicketPriority) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return priority;
    }
  };

  const getCategoryText = (category: SupportTicketCategory) => {
    switch (category) {
      case 'technical': return 'تقني';
      case 'billing': return 'الفوترة';
      case 'general': return 'عام';
      case 'feature_request': return 'طلب ميزة';
      case 'bug_report': return 'تقرير خطأ';
      default: return category;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTicketItem = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity
      style={styles.ticketCard}
      onPress={() => router.push(`/support/ticket/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketNumber}>{item.ticket_number}</Text>
          <Text style={styles.ticketSubject} numberOfLines={1}>
            {item.subject}
          </Text>
        </View>
        <View style={styles.ticketMeta}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.ticketFooter}>
        <View style={styles.ticketTags}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.priorityText}>{getPriorityText(item.priority)}</Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{getCategoryText(item.category)}</Text>
          </View>
        </View>
        <Text style={styles.ticketDate}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (filter: 'all' | SupportTicketStatus, label: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => handleFilterChange(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStatistics = () => {
    if (statisticsLoading) {
      return (
        <View style={styles.statisticsContainer}>
          <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
        </View>
      );
    }

    if (!statistics) return null;

    return (
      <View style={styles.statisticsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{statistics.total}</Text>
          <Text style={styles.statLabel}>إجمالي التذاكر</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: BRAND_COLORS.info }]}>
            {statistics.open}
          </Text>
          <Text style={styles.statLabel}>مفتوحة</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: BRAND_COLORS.success }]}>
            {statistics.closed}
          </Text>
          <Text style={styles.statLabel}>مغلقة</Text>
        </View>
      </View>
    );
  };

  if (ticketsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={BRAND_COLORS.error} />
          <Text style={styles.errorText}>{ticketsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchTickets()}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>الدعم الفني</Text>
          </View>
          <TouchableOpacity
            style={styles.newTicketButton}
            onPress={() => router.push('/support/new-ticket' as any)}
          >
            <MaterialIcons name="add" size={20} color={BRAND_COLORS.text.inverse} />
            <Text style={styles.newTicketButtonText}>تذكرة جديدة</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        {renderStatistics()}

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersRow}>
              {renderFilterButton('all', 'الكل')}
              {renderFilterButton('open', 'مفتوحة')}
              {renderFilterButton('in_progress', 'قيد المعالجة')}
              {renderFilterButton('pending', 'في الانتظار')}
              {renderFilterButton('resolved', 'تم الحل')}
              {renderFilterButton('closed', 'مغلقة')}
            </View>
          </ScrollView>
        </View>

        {/* Tickets List */}
        <FlatList
          data={tickets}
          renderItem={renderTicketItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.ticketsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[BRAND_COLORS.primary]}
              tintColor={BRAND_COLORS.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            ticketsLoading && tickets.length > 0 ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !ticketsLoading ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="support-agent" size={64} color={BRAND_COLORS.gray[400]} />
                <Text style={styles.emptyTitle}>لا توجد تذاكر دعم</Text>
                <Text style={styles.emptySubtitle}>
                  لم تقم بإنشاء أي تذاكر دعم بعد
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/support/new-ticket' as any)}
                >
                  <Text style={styles.emptyButtonText}>إنشاء تذكرة جديدة</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  newTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  newTicketButtonText: {
    color: BRAND_COLORS.text.inverse,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginLeft: SPACING.xs,
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: BRAND_COLORS.background.secondary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  filtersContainer: {
    paddingVertical: SPACING.md,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.background.primary,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    marginRight: SPACING.sm,
  },
  filterButtonActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  filterButtonTextActive: {
    color: BRAND_COLORS.text.inverse,
  },
  ticketsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  ticketCard: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  ticketInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  ticketNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.primary,
    marginBottom: SPACING.xs,
  },
  ticketSubject: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
  },
  ticketMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.inverse,
  },
  ticketDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTags: {
    flexDirection: 'row',
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    marginRight: SPACING.sm,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.inverse,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.gray[200],
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  ticketDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
  },
  loadingFooter: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['6xl'],
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: BRAND_COLORS.text.inverse,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  retryButtonText: {
    color: BRAND_COLORS.text.inverse,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});
