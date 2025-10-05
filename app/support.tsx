import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useSupportStore } from '../store/useSupportStore';
import { SupportTicket, SupportTicketCategory, SupportTicketPriority, SupportTicketStatus } from '../utils/api';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

export default function SupportScreen() {
  const router = useRouter();
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
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'pending': return 'Pending';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const getPriorityText = (priority: SupportTicketPriority) => {
    switch (priority) {
      case 'urgent': return 'Urgent';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return priority;
    }
  };

  const getCategoryText = (category: SupportTicketCategory) => {
    switch (category) {
      case 'technical': return 'Technical';
      case 'billing': return 'Billing';
      case 'general': return 'General';
      case 'feature_request': return 'Feature Request';
      case 'bug_report': return 'Bug Report';
      default: return category;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
          <Text style={styles.ticketNumber}>#{item.ticket_number}</Text>
          <Text style={styles.ticketSubject} numberOfLines={2}>
            {item.subject}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.ticketFooter}>
        <View style={styles.ticketTags}>
          <View style={[styles.priorityBadge, { borderColor: getPriorityColor(item.priority) }]}>
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {getPriorityText(item.priority)}
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <MaterialIcons name="label-outline" size={14} color={BRAND_COLORS.text.secondary} />
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
          <View style={[styles.statIconContainer, { backgroundColor: `${BRAND_COLORS.primary}15` }]}>
            <MaterialIcons name="confirmation-number" size={24} color={BRAND_COLORS.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statNumber}>{statistics.total}</Text>
            <Text style={styles.statLabel}>Total Tickets</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: `${BRAND_COLORS.info}15` }]}>
            <MaterialIcons name="access-time" size={24} color={BRAND_COLORS.info} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: BRAND_COLORS.info }]}>
              {statistics.open}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconContainer, { backgroundColor: `${BRAND_COLORS.success}15` }]}>
            <MaterialIcons name="check-circle-outline" size={24} color={BRAND_COLORS.success} />
          </View>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: BRAND_COLORS.success }]}>
              {statistics.closed}
            </Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>
      </View>
    );
  };

  if (ticketsError) {
    return (
      <SafeAreaWrapper backgroundColor="#FFFFFF">
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={BRAND_COLORS.error} />
          <Text style={styles.errorText}>{ticketsError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchTickets()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.primary} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Support Center</Text>
              <Text style={styles.headerSubtitle}>How can we help you?</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.newTicketButton}
            onPress={() => router.push('/support/new-ticket' as any)}
          >
            <MaterialIcons name="add" size={22} color={BRAND_COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        {renderStatistics()}

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollContent}>
            {renderFilterButton('all', 'All')}
            {renderFilterButton('open', 'Open')}
            {renderFilterButton('in_progress', 'In Progress')}
            {renderFilterButton('pending', 'Pending')}
            {renderFilterButton('resolved', 'Resolved')}
            {renderFilterButton('closed', 'Closed')}
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
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="support-agent" size={80} color={BRAND_COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Support Tickets Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Need help? Create a support ticket and our{'\n'}team will get back to you soon!
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/support/new-ticket' as any)}
                >
                  <MaterialIcons name="add-circle-outline" size={20} color={BRAND_COLORS.white} />
                  <Text style={styles.emptyButtonText}>Create New Ticket</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
              </View>
            )
          }
        />
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.tertiary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: BRAND_COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
  },
  newTicketButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statisticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: BRAND_COLORS.background.primary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  filtersContainer: {
    paddingVertical: SPACING.lg,
  },
  filtersScrollContent: {
    paddingHorizontal: SPACING.lg,
  },
  filterButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.background.primary,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border.primary,
    marginRight: SPACING.sm,
  },
  filterButtonActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.secondary,
  },
  filterButtonTextActive: {
    color: BRAND_COLORS.white,
  },
  ticketsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  ticketCard: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  ticketInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  ticketNumber: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.primary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
  },
  ticketSubject: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.white,
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
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border.primary,
  },
  ticketTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: SPACING.sm,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.gray[100],
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
    marginLeft: 4,
  },
  ticketDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
  },
  loadingFooter: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: SPACING['6xl'],
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['6xl'],
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${BRAND_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: BRAND_COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginLeft: SPACING.sm,
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
    marginVertical: SPACING.xl,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  retryButtonText: {
    color: BRAND_COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
});
