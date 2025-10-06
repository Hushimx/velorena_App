import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EmptyState } from '../../components/ErrorState';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { TextLineSkeleton } from '../../components/Skeleton';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useOrders } from '../../hooks/useOrders';
import { useSkeletonLoading } from '../../hooks/useSkeletonLoading';
import { getImageUrl } from '../../utils/api';

const COLORS = {
  primary: BRAND_COLORS.primary,
  secondary: BRAND_COLORS.secondary,
  accent: BRAND_COLORS.accent,
  success: BRAND_COLORS.success,
  warning: BRAND_COLORS.warning,
  danger: BRAND_COLORS.error,
  info: BRAND_COLORS.info,
  light: BRAND_COLORS.background.tertiary,
  dark: BRAND_COLORS.text.primary,
  white: BRAND_COLORS.white,
  gray: BRAND_COLORS.gray,
};

const STATUS_CONFIG = {
  pending: { 
    color: '#fff3cd', 
    text: 'قيد الانتظار', 
    textColor: '#856404',
    icon: '⏳',
    bgColor: '#fef9e7'
  },
  confirmed: { 
    color: '#d4edda', 
    text: 'مؤكد', 
    textColor: '#155724',
    icon: '✅',
    bgColor: '#f0f9f0'
  },
  processing: { 
    color: '#d1ecf1', 
    text: 'قيد المعالجة', 
    textColor: '#0c5460',
    icon: '⚙️',
    bgColor: '#f0f8ff'
  },
  shipped: { 
    color: '#d1ecf1', 
    text: 'تم الشحن', 
    textColor: '#0c5460',
    icon: '🚚',
    bgColor: '#f0f8ff'
  },
  delivered: { 
    color: '#d4edda', 
    text: 'تم التوصيل', 
    textColor: '#155724',
    icon: '📦',
    bgColor: '#f0f9f0'
  },
  cancelled: { 
    color: '#f8d7da', 
    text: 'ملغي', 
    textColor: '#721c24',
    icon: '❌',
    bgColor: '#fef2f2'
  },
  deleted: { 
    color: COLORS.gray[100], 
    text: 'محذوف', 
    textColor: COLORS.gray[600],
    icon: '🗑️',
    bgColor: COLORS.gray[50]
  },
};

export default function OrdersList() {
  const { orders, loading, hasMore, loadMore, reload, setFilter } = useOrders();
  const router = useRouter();
  const searchParams = useLocalSearchParams();

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Skeleton loading with minimum display time for load more
  const showLoadMoreSkeleton = useSkeletonLoading({ 
    isLoading: loading, 
    minimumDisplayTime: 1000 
  });

  // Auto-refresh when returning from order details with refresh parameter
  useEffect(() => {
    if (searchParams.refresh === 'true') {
      reload();
      router.setParams({ refresh: undefined, timestamp: undefined });
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  }, [searchParams.refresh, reload, router]);

  const handleRefresh = () => {
    reload();
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const handleFilterChange = (status: string) => {
    setSelectedStatus(status);
    if (status === 'all') {
      setFilter({});
    } else {
      setFilter({ status: status as any });
    }
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setFilter({});
    setShowFilterModal(false);
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'أمس';
    if (diffDays === 0) return 'اليوم';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getDisplayData = (order: any) => {
    const firstOrderItem = order?.items?.[0];
    const title = firstOrderItem?.product?.name || firstOrderItem?.name || `طلب #${order?.order_number ?? order?.id}`;
    const count = order?.items?.length ?? 0;
    const total = order?.total ?? 0;
    const image = getImageUrl(
      firstOrderItem?.product?.image_url || 
      firstOrderItem?.product?.image || 
      firstOrderItem?.product?.main_image ||
      firstOrderItem?.image
    );
    return { title, count, total, image };
  };

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF" style={styles.container}>
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
          <Text style={styles.headerTitle}>طلباتي</Text>
          <Text style={styles.headerSubtitle}>{orders.length} طلب</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7} onPress={handleFilterPress}>
          <MaterialIcons name="filter-list" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Success Message */}
      {showSuccessMessage && (
        <View style={styles.successMessage}>
          <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
          <Text style={styles.successMessageText}>تم حذف الطلب بنجاح</Text>
        </View>
      )}

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(o) => String(o.id ?? o.order_number)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item, index }) => {
          const statusConfig = getStatusConfig(item.status);
          const { title, count, total, image } = getDisplayData(item);
          const isFirst = index === 0;
          const isLast = index === orders.length - 1;
          
          return (
            <TouchableOpacity 
              style={[
                styles.orderCard,
                isFirst && styles.firstCard,
                isLast && styles.lastCard
              ]} 
              onPress={() => router.push(`/orders/${item.id ?? item.order_number}` as any)}
              activeOpacity={0.7}
            >
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>طلب #{item.order_number ?? item.id}</Text>
                  <View style={styles.orderTitleRow}>
                    <View style={styles.orderTitleContainer}>
                      <Text style={styles.orderTitle} numberOfLines={2}>{title}</Text>
                    </View>
                    {image && (
                      <Image 
                        source={{ uri: image }} 
                        style={styles.orderImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </View>
              </View>

              {/* Status and Date Row */}
              <View style={styles.statusDateRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                  <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                  <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                    {statusConfig.text}
                  </Text>
                </View>
                <Text style={styles.orderDate}>
                  {item.created_at ? formatDate(item.created_at) : ''}
                </Text>
              </View>

            </TouchableOpacity>
          );
        }}
        onEndReachedThreshold={0.4}
        onEndReached={() => hasMore && loadMore()}
        ListFooterComponent={
          showLoadMoreSkeleton ? (
            <View style={styles.skeletonContainer}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={styles.skeletonOrderCard}>
                  <View style={styles.skeletonOrderHeader}>
                    <TextLineSkeleton width="60%" height={18} />
                    <TextLineSkeleton width={80} height={16} />
                  </View>
                  <View style={styles.skeletonOrderBody}>
                    <TextLineSkeleton width="40%" height={14} />
                    <TextLineSkeleton width="30%" height={14} />
                  </View>
                  <View style={styles.skeletonOrderActions}>
                    <TextLineSkeleton width={60} height={32} />
                    <TextLineSkeleton width={60} height={32} />
                  </View>
                </View>
              ))}
            </View>
          ) : hasMore ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore} activeOpacity={0.7}>
              <MaterialIcons name="expand-more" size={20} color={COLORS.white} />
              <Text style={styles.loadMoreText}>تحميل المزيد</Text>
            </TouchableOpacity>
          ) : orders.length > 0 ? (
            <View style={styles.endMessage}>
              <MaterialIcons name="check-circle" size={24} color={COLORS.success} />
              <Text style={styles.endMessageText}>تم عرض جميع الطلبات</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="لا توجد طلبات"
              message="ابدأ بالتسوق وإنشاء طلبك الأول"
              iconName="shopping-bag"
              style={styles.emptyContainer}
            />
          ) : null
        }
      />

      {/* Filter Modal */}
      {showFilterModal && (
        <View style={styles.filterModal}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>تصفية الطلبات</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.filterModalClose}>
                <MaterialIcons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.filterOptions}
              contentContainerStyle={styles.filterOptionsContent}
              showsVerticalScrollIndicator={false}
            >
              {/* All Orders Option */}
              <TouchableOpacity
                style={[styles.filterOption, styles.allOption, selectedStatus === 'all' && styles.filterOptionSelected]}
                onPress={() => handleFilterChange('all')}
              >
                <View style={styles.filterOptionContent}>
                  <MaterialIcons name="list" size={20} color={selectedStatus === 'all' ? COLORS.primary : COLORS.gray[600]} />
                  <Text style={[styles.filterOptionText, selectedStatus === 'all' && styles.filterOptionTextSelected]}>
                    جميع الطلبات
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Active Orders Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>الطلبات النشطة</Text>
                
                {['pending', 'confirmed'].map(status => {
                  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[styles.filterOption, selectedStatus === status && styles.filterOptionSelected]}
                      onPress={() => handleFilterChange(status)}
                    >
                      <View style={styles.filterOptionContent}>
                        <View style={[styles.statusIndicator, { backgroundColor: config.bgColor }]} />
                        <Text style={[styles.filterOptionText, selectedStatus === status && styles.filterOptionTextSelected]}>
                          {config.text}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Completed Orders Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>الطلبات المكتملة</Text>
                
                <TouchableOpacity
                  style={[styles.filterOption, selectedStatus === 'delivered' && styles.filterOptionSelected]}
                  onPress={() => handleFilterChange('delivered')}
                >
                  <View style={styles.filterOptionContent}>
                    <View style={[styles.statusIndicator, { backgroundColor: STATUS_CONFIG.delivered.bgColor }]} />
                    <Text style={[styles.filterOptionText, selectedStatus === 'delivered' && styles.filterOptionTextSelected]}>
                      {STATUS_CONFIG.delivered.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Cancelled Orders Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>الطلبات الملغية</Text>
                
                <TouchableOpacity
                  style={[styles.filterOption, selectedStatus === 'cancelled' && styles.filterOptionSelected]}
                  onPress={() => handleFilterChange('cancelled')}
                >
                  <View style={styles.filterOptionContent}>
                    <View style={[styles.statusIndicator, { backgroundColor: STATUS_CONFIG.cancelled.bgColor }]} />
                    <Text style={[styles.filterOptionText, selectedStatus === 'cancelled' && styles.filterOptionTextSelected]}>
                      {STATUS_CONFIG.cancelled.text}
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
    backgroundColor: COLORS.white,
    writingDirection: 'rtl',
  },
  
  // Header
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
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
    marginHorizontal: SPACING.md,
    direction: 'rtl',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    writingDirection: 'rtl',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginTop: 2,
    writingDirection: 'rtl',
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

  // Success Message
  successMessage: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  successMessageText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // List Container
  listContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },

  // Order Card
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  firstCard: {
    marginTop: SPACING.xs,
  },
  lastCard: {
    marginBottom: SPACING.xl,
  },
  orderHeader: {
    marginBottom: SPACING.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: SPACING.xs,
  },
  orderTitleContainer: {
    flex: 1,
    marginRight: SPACING.sm,
    minHeight: 44, // Ensure minimum height to prevent clipping
  },
  statusDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  orderTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize.base,
    paddingVertical: SPACING.xs,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs / 2,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  orderImage: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[100],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  orderStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  orderActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    gap: SPACING.xs,
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  dangerText: {
    color: COLORS.danger,
  },

  // Loading and Empty States
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  loadMoreText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  endMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['2xl'],
    gap: SPACING.sm,
  },
  endMessageText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['5xl'],
    paddingHorizontal: SPACING['4xl'],
  },

  // Skeleton Styles
  skeletonContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  skeletonOrderCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  skeletonOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  skeletonOrderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    marginBottom: SPACING.md,
  },
  skeletonOrderActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'flex-end',
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
});