import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    bgColor: '#fef9e7',
    borderColor: '#f9e79f'
  },
  confirmed: { 
    color: '#d4edda', 
    text: 'في انتظار الدفع', 
    textColor: '#155724',
    bgColor: '#f0f9f0',
    borderColor: '#a8d5a8'
  },
  processing: { 
    color: '#d1ecf1', 
    text: 'قيد المعالجة', 
    textColor: '#0c5460',
    bgColor: '#f0f8ff',
    borderColor: '#a8d8e8'
  },
  shipped: { 
    color: '#d1ecf1', 
    text: 'تم الشحن', 
    textColor: '#0c5460',
    bgColor: '#f0f8ff',
    borderColor: '#a8d8e8'
  },
  delivered: { 
    color: '#d4edda', 
    text: 'تم التوصيل', 
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
  deleted: { 
    color: COLORS.gray[100], 
    text: 'محذوف', 
    textColor: COLORS.gray[600],
    bgColor: COLORS.gray[50],
    borderColor: COLORS.gray[300]
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

  const getDisplayData = (order: any) => {
    const firstOrderItem = order?.items?.[0];
    const title = firstOrderItem?.product?.name || firstOrderItem?.name || `طلب #${order?.order_number ?? order?.id}`;
    const image = getImageUrl(
      firstOrderItem?.product?.image_url || 
      firstOrderItem?.product?.image || 
      firstOrderItem?.product?.main_image ||
      firstOrderItem?.image
    );
    return { title, image };
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
        <View style={styles.headerSpacer} />
      </View>



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
          const { title, image } = getDisplayData(item);
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
                <View style={styles.dateContainer}>
                  <MaterialIcons name="schedule" size={14} color={COLORS.gray[500]} />
                  <Text style={styles.orderDate}>
                    {item.created_at ? formatDate(item.created_at) : ''}
                  </Text>
                </View>
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
  headerSpacer: {
    width: 40,
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
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.md,
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
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  orderTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize.lg,
    paddingVertical: SPACING.xs,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs / 2,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.medium,
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    minWidth: 100,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    letterSpacing: 0.3,
  },
  dateContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.xs,
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
});