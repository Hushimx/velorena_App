import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useOrders } from '../../hooks/useOrders';

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
  pending: { color: '#fff3cd', text: 'قيد الانتظار', textColor: '#856404' }, // Soft yellow
  confirmed: { color: '#d4edda', text: 'مؤكد', textColor: '#155724' }, // Soft green
  shipped: { color: '#d1ecf1', text: 'تم الشحن', textColor: '#0c5460' }, // Soft blue
  delivered: { color: '#d4edda', text: 'تم التوصيل', textColor: '#155724' }, // Soft green
  cancelled: { color: '#f8d7da', text: 'ملغي', textColor: '#721c24' }, // Soft red
  deleted: { color: COLORS.gray[100], text: 'محذوف', textColor: COLORS.gray[600] },
};

export default function OrdersList() {
  const { orders, loading, hasMore, loadMore, reload } = useOrders();
  const router = useRouter();
  const searchParams = useLocalSearchParams();

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Auto-refresh when returning from order details with refresh parameter
  useEffect(() => {
    if (searchParams.refresh === 'true') {
      // Clear the refresh parameter and reload orders
      reload();
      // Remove the refresh parameter from URL
      router.setParams({ refresh: undefined, timestamp: undefined });
      
      // Show success message briefly
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  }, [searchParams.refresh, reload, router]);

  // Handle manual refresh
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
    const title = firstOrderItem?.name || `طلب #${order?.order_number ?? order?.id}`;
    const count = order?.items?.length ?? 0;
    const total = order?.total ?? 0;
    return { title, count, total };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلباتي</Text>
        <View style={styles.headerSpacer} />
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
        renderItem={({ item }) => {
          const statusConfig = getStatusConfig(item.status);
          const { title: productTitle, count, total } = getDisplayData(item);
          return (
            <TouchableOpacity 
              style={styles.orderCard} 
              onPress={() => router.push(`/orders/${item.id ?? item.order_number}` as any)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle}>{productTitle}</Text>
                  <Text style={styles.orderNumber}>#{item.order_number ?? item.id}</Text>
                  <Text style={styles.orderDate}>{item.created_at ? formatDate(item.created_at) : ''}</Text>
                  <Text style={styles.orderItems}>{count} منتج</Text>
                </View>
                <View style={styles.orderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
                    <Text style={[styles.statusText, { color: statusConfig.textColor }]}>{statusConfig.text}</Text>
                  </View>
                  <Text style={styles.orderPrice}>{formatPrice(total)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        onEndReachedThreshold={0.4}
        onEndReached={() => hasMore && loadMore()}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>جاري تحميل المزيد...</Text>
            </View>
          ) : hasMore ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
              <Text style={styles.loadMoreText}>تحميل المزيد</Text>
            </TouchableOpacity>
          ) : orders.length > 0 ? (
            <View style={styles.endMessage}>
              <Text style={styles.endMessageText}>تم عرض جميع الطلبات</Text>
            </View>
          ) : null
        }
                 ListEmptyComponent={
           !loading ? (
             <View style={styles.emptyContainer}>
               <MaterialIcons name="shopping-bag" size={64} color={COLORS.gray[400]} />
               <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
               <Text style={styles.emptySubtitle}>ابدأ بالتسوق وإنشاء طلبك الأول</Text>
             </View>
           ) : null
         }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light,
    paddingTop: 44, // System status bar padding
    direction: 'rtl',
  },
  
  // Header
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
  headerSpacer: {
    width: 44,
  },

  // Success Message
  successMessage: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginHorizontal: SPACING.xl,
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
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
  },

  // Order Card
  orderCard: {
    backgroundColor: '#fefefe', // Soft white
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Soft gray border
    ...SHADOWS.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  orderTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize.lg,
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
    marginBottom: SPACING.xs / 2,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  orderItems: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  orderPrice: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },


  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    marginTop: SPACING.lg,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    marginTop: SPACING.lg,
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
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});
