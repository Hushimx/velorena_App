import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useOrders } from '../../hooks/useOrders';
import { useCartStore } from '../../store/useCartStore';

const COLORS = {
  primary: '#2a1e1e',      // BROWN - main brand color
  secondary: '#ffde9f',    // YELLOW - accent color
  success: '#10b981',      // Green for delivered
  warning: '#f59e0b',      // Orange for pending
  danger: '#ef4444',       // Red for cancelled
  info: '#1e40af',         // Blue for confirmed (using app's brand blue)
  light: '#f8fafc',        // Light background
  dark: '#1e293b',         // Dark text
  white: '#ffffff',        // White background
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
};

const STATUS_CONFIG = {
  pending: { color: COLORS.white, text: 'قيد الانتظار' },
  confirmed: { color: COLORS.info, text: 'مؤكد'},
  shipped: { color: COLORS.primary, text: 'تم الشحن'},
  delivered: { color: COLORS.success, text: 'تم التوصيل'},
  cancelled: { color: COLORS.danger, text: 'ملغي'},
  deleted: { color: COLORS.gray[600], text: 'محذوف'},
};

export default function OrdersList() {
  const { orders, loading, hasMore, loadMore, setFilter, params, reload } = useOrders();
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const cartItems = useCartStore((s) => s.items);

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

  const matchCartItem = (orderItem: any) => {
    if (!orderItem) return undefined;
    const productId = orderItem.product_id || orderItem.id || orderItem.productId;
    return cartItems.find((c) => String(c.id) === String(productId));
  };

  const getDisplayData = (order: any) => {
    const firstOrderItem = order?.items?.[0];
    const matchedCart = matchCartItem(firstOrderItem);
    const title = (matchedCart?.name_ar || matchedCart?.name || firstOrderItem?.name) ?? `#${order?.order_number ?? order?.id}`;
    const image = matchedCart?.image || firstOrderItem?.image_url || firstOrderItem?.image || firstOrderItem?.thumbnail || null;
    const quantityFromOrder = firstOrderItem?.quantity ?? 0;
    const quantityFromCart = matchedCart?.quantity ?? 0;
    const quantity = quantityFromOrder || quantityFromCart || 1;
    const count = (order?.items?.length ?? 0) || cartItems.length || 0;
    const totalFromOrder = order?.total ?? 0;
    const totalFromCart = cartItems.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0);
    const total = totalFromOrder || totalFromCart || 0;
    return { title, image, quantity, count, total };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <MaterialIcons name="bookmark" size={24} color={COLORS.primary} />
              <Text style={styles.headerTitle}>طلباتي</Text>
            </View>
            <Text style={styles.headerSubtitle}>إدارة وتتبع طلباتك</Text>
          </View>

          <TouchableOpacity
            onPress={() => setFilter({})}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="tune" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Success Message */}
      {showSuccessMessage && (
        <View style={styles.successMessage}>
          <MaterialIcons name="check-circle" size={20} color={COLORS.white} />
          <Text style={styles.successMessageText}>تم حذف الطلب بنجاح</Text>
        </View>
      )}

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity 
              style={[
                styles.filterChip, 
                !params.status && styles.filterChipActive
              ]} 
              onPress={() => setFilter({ status: undefined })}
            >
              <Text style={[
                styles.filterChipText,
                !params.status && styles.filterChipTextActive
              ]}>الكل</Text>
            </TouchableOpacity>
            
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <TouchableOpacity 
                key={status}
                style={[
                  styles.filterChip, 
                  params.status === status && styles.filterChipActive
                ]} 
                onPress={() => setFilter({ status: status as any })}
              >
                <Text style={[
                  styles.filterChipText,
                  params.status === status && styles.filterChipTextActive
                ]}>{config.text}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Special filter for cancelled + deleted orders */}
            <TouchableOpacity 
              style={[
                styles.filterChip, 
                params.status === 'cancelled_or_deleted' && styles.filterChipActive
              ]} 
              onPress={() => setFilter({ status: 'cancelled_or_deleted' as any })}
            >
              <Text style={[
                styles.filterChipText,
                params.status === 'cancelled_or_deleted' && styles.filterChipTextActive
              ]}>ملغي/محذوف</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={COLORS.gray[400]} style={styles.searchIconRTL} />
          <TextInput
            placeholder='ابحث في الطلبات...'
            placeholderTextColor={COLORS.gray[400]}
            style={styles.searchInput}
            defaultValue={params.search}
            onSubmitEditing={(e) => setFilter({ search: e.nativeEvent.text })}
            returnKeyType='search'
          />
        </View>
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
        renderItem={({ item }) => {
          const statusConfig = getStatusConfig(item.status);
          const { title: productTitle, image: productImage, quantity, count, total } = getDisplayData(item);
          return (
            <TouchableOpacity 
              style={styles.orderCard} 
              onPress={() => router.push(`/orders/${item.id ?? item.order_number}` as any)}
              activeOpacity={0.7}
            >
              {/* Status Badge */}
              <View style={[styles.statusPill, { backgroundColor: statusConfig.color }]}> 
                <Text style={styles.statusPillText}>{statusConfig.text}</Text>
              </View>

              {/* Product Row */}
              <View style={styles.productRow}>
                <View style={styles.productInfoContainer}>
                  <Text style={styles.productTitle} numberOfLines={1}>{productTitle}</Text>
                  <Text style={styles.orderNumberSmall}>#{item.order_number ?? item.id}</Text>
                  <Text style={styles.metaText}> {item.created_at ? `${formatDate(item.created_at)} :` : ''}</Text>
                  <Text style={styles.metaText}> {`الكمية: ${quantity || 1}`}</Text>
                </View>
                {productImage ? (
                  <Image source={{ uri: String(productImage) }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.imagePlaceholder]} />
                )}
              </View>

              {/* Price and count */}
              <View style={styles.detailRowBetween}>
                <Text style={styles.totalPriceLabel}><Text style={styles.totalPriceValue}>{formatPrice(total)}</Text> : المبلغ الإجمالي</Text>
                <Text style={styles.itemsCountText}>{`#${count} منتج`}</Text>
              </View>

              {/* Order Footer */}
              <View style={styles.orderFooter}>
                <View style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>عرض التفاصيل</Text>
                  <Text style={styles.viewButtonIcon}>→</Text>
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
               <Text style={styles.emptySubtitle}>
                 {params.search || params.status 
                   ? 'جرب تغيير معايير البحث' 
                   : 'ابدأ بالتسوق وإنشاء طلبك الأول'
                 }
               </Text>
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
  },
  
  // Header
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row-reverse', // RTL: icon then text visually
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_400Regular',
  },

  // Success Message
  successMessage: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: COLORS.gray[700],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  successMessageText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },

  // Search Section
  searchSection: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: COLORS.gray[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 5,
  },
  searchIconRTL: {
    fontSize: 18,
    marginLeft: 12,
    color: COLORS.gray[400],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[700],
    textAlign: 'right',
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_400Regular',
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersScroll: {
    paddingHorizontal: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary, // BROWN
    borderColor: COLORS.primary, // BROWN
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginRight: 6, // RTL: margin on the right
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  filterChipTextActive: {
    color: COLORS.white,
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  filterChipIcon: {
    fontSize: 14,
  },

  // List Container
  listContainer: {
    padding: 20,
    paddingTop: 16,
  },

  // Order Card
  orderCard: {
    backgroundColor: COLORS.secondary, // YELLOW background
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.gray[700],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  productRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productInfoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },
  orderNumberSmall: {
    fontSize: 14,
    color: COLORS.gray[700],
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  productImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    marginLeft: 12,
    backgroundColor: COLORS.white,
  },
  imagePlaceholder: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  detailRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalPriceLabel: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  totalPriceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },
  itemsCountText: {
    fontSize: 14,
    color: COLORS.gray[700],
    fontFamily: 'NotoSansArabic_400Regular',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumberContainer: {
    flex: 1,
    alignItems: 'flex-end', // RTL: align content to the right
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },
  orderDate: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'right',
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_400Regular',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 4, // RTL: margin on the right
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_700Bold',
  },

  // Order Details
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'right',
    writingDirection: 'rtl', // Ensure RTL text direction
    flex: 1, // Take available space
    fontFamily: 'NotoSansArabic_400Regular',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'left', // Values on the left for RTL
    minWidth: 80, // Ensure consistent spacing
    fontFamily: 'NotoSansArabic_700Bold',
  },
  itemsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    alignItems: 'flex-end', // RTL: align content to the right
  },
  itemsLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_400Regular',
  },
  itemsText: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_400Regular',
  },

  // Order Footer
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: 16,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary, // BROWN background
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary, // BROWN border
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white, // White text on BROWN background
    marginRight: 8, // RTL: margin on the right
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  viewButtonIcon: {
    fontSize: 16,
    color: COLORS.white, // White icon on BROWN background
    fontWeight: '700',
    transform: [{ scaleX: -1 }], // Flip arrow for RTL
    fontFamily: 'NotoSansArabic_700Bold',
  },

  // Loading and Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginTop: 16,
    textAlign: 'center',
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_400Regular',
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary, // BROWN background
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary, // BROWN border
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white, // White text on BROWN background
    writingDirection: 'rtl', // Ensure RTL text direction
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
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_400Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginBottom: 8,
    textAlign: 'center',
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_700Bold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    writingDirection: 'rtl', // Ensure RTL text direction
    fontFamily: 'NotoSansArabic_400Regular',
  },
});
