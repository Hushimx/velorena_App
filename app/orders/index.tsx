import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { EmptyState, ErrorState } from '../../components/ErrorState';
import { LoadingSpinner, SectionLoading } from '../../components/LoadingSpinner';
import { TextLineSkeleton } from '../../components/Skeleton';
import { useSkeletonLoading } from '../../hooks/useSkeletonLoading';
import { useOrders } from '../../hooks/useOrders';
import { getImageUrl } from '../../utils/api';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';

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
  const { orders, loading, hasMore, loadMore, reload } = useOrders();
  const router = useRouter();
  const searchParams = useLocalSearchParams();

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>طلباتي</Text>
          <Text style={styles.headerSubtitle}>{orders.length} طلب</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
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
                    <Text style={styles.orderTitle} numberOfLines={2}>{title}</Text>
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
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    paddingTop: 44,
  },
  
  // Header
  header: {
    flexDirection: 'row',
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
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginTop: 2,
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
    writingDirection: 'rtl',
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
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: SPACING.sm,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize.base,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs / 2,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
});