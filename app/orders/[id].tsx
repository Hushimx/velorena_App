import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ErrorState } from '../../components/ErrorState';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { TextLineSkeleton } from '../../components/Skeleton';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useOrder } from '../../hooks/useOrder';
import { useSkeletonLoading } from '../../hooks/useSkeletonLoading';
import { useAuthStore } from '../../store/useAuthStore';
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

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, loading, error, remove } = useOrder(id);
  const { user } = useAuthStore();
  const router = useRouter();

  // Skeleton loading with minimum display time
  const showSkeleton = useSkeletonLoading({ 
    isLoading: loading, 
    minimumDisplayTime: 1500 
  });

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(price);
  };

  const handleDelete = async () => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const success = await remove();
            if (success) { 
              Alert.alert('تم الحذف', 'تم حذف الطلب بنجاح', [
                {
                  text: 'تم',
                  onPress: () => {
                    router.push({
                      pathname: '/orders' as any,
                      params: { refresh: 'true', timestamp: Date.now().toString() }
                    });
                  }
                }
              ]); 
            } else { 
              Alert.alert('خطأ', error || 'تعذر حذف الطلب'); 
            }
          }
        }
      ]
    );
  };

  const handlePayment = () => {
    if (!order?.id) {
      Alert.alert('خطأ', 'لم يتم العثور على بيانات الطلب');
      return;
    }

    // Navigate to checkout page with order ID for payment
    router.push({
      pathname: '/checkout' as any,
      params: { 
        orderId: order.id.toString(),
        mode: 'payment'
      }
    });
  };

  if (showSkeleton) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <View style={styles.backButton} />
          <View style={styles.headerTitle} />
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Order Header Skeleton */}
          <View style={styles.orderHeaderCard}>
            <View style={styles.skeletonOrderHeader}>
              <TextLineSkeleton width={100} height={20} />
              <TextLineSkeleton width="60%" height={16} />
            </View>
            <View style={styles.skeletonOrderSummary}>
              <TextLineSkeleton width="100%" height={16} />
              <TextLineSkeleton width="80%" height={16} />
              <TextLineSkeleton width="60%" height={16} />
            </View>
          </View>

          {/* Contact Info Skeleton */}
          <View style={styles.sectionCard}>
            <TextLineSkeleton width={120} height={18} />
            <View style={styles.skeletonInfoRow}>
              <TextLineSkeleton width="40%" height={16} />
              <TextLineSkeleton width="60%" height={16} />
            </View>
          </View>

          {/* Items Skeleton */}
          <View style={styles.sectionCard}>
            <TextLineSkeleton width={150} height={18} />
            {Array.from({ length: 2 }).map((_, index) => (
              <View key={index} style={styles.skeletonItemCard}>
                <View style={styles.skeletonItemHeader}>
                  <TextLineSkeleton width="70%" height={16} />
                  <TextLineSkeleton width={60} height={60} />
                </View>
                <View style={styles.skeletonItemDetails}>
                  <TextLineSkeleton width="50%" height={14} />
                  <TextLineSkeleton width="30%" height={14} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaWrapper>
    );
  }

  if (error) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <ErrorState
          title="حدث خطأ"
          message={error}
          onRetry={() => router.replace('/orders' as any)}
          retryText="العودة للطلبات"
          fullScreen
        />
      </SafeAreaWrapper>
    );
  }

  if (!order) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <ErrorState
          title="لم يتم العثور على الطلب"
          message="الطلب المطلوب غير موجود أو تم حذفه"
          onRetry={() => router.replace('/orders' as any)}
          retryText="العودة للطلبات"
          iconName="shopping-bag"
          fullScreen
        />
      </SafeAreaWrapper>
    );
  }

  const statusConfig = getStatusConfig(order.status);

  return (
    <SafeAreaWrapper backgroundColor={COLORS.white} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Action - First Priority */}
        {order.status === 'confirmed' && order.payment_status !== 'paid' && (
          <View style={styles.actionsCard}>
            <View style={styles.actionHeader}>
              <MaterialIcons name="payment" size={24} color={COLORS.success} />
              <Text style={styles.actionTitle}>إتمام الدفع</Text>
            </View>
            <Text style={styles.actionDescription}>
              يرجى إتمام عملية الدفع لتأكيد طلبك
            </Text>
            <TouchableOpacity 
              style={styles.paymentButton} 
              onPress={handlePayment}
            >
              <Text style={styles.paymentButtonText}>
                دفع الآن
              </Text>
              <MaterialIcons name="payment" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Order Header Card */}
        <View style={styles.orderHeaderCard}>
          {/* Top Section with Order Info */}
          <View style={styles.orderHeaderTop}>
            <View style={styles.orderInfo}>
              <View style={styles.orderNumberContainer}>
                <Text style={styles.orderNumberLabel}>رقم الطلب</Text>
                <Text style={styles.orderNumber}>
                  #{order.order_number}
                </Text>
              </View>
              <View style={styles.orderDateContainer}>
                <MaterialIcons name="access-time" size={16} color={COLORS.gray[500]} />
                <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
              </View>
            </View>
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
          </View>
          
          {/* Divider */}
          <View style={styles.divider} />
          
          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <Text style={styles.summaryTitle}>ملخص الطلب</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>المبلغ الفرعي</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.subtotal || 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>الضريبة (15%)</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.tax || 0)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>المبلغ الإجمالي</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>معلومات الاتصال</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoValue}>{order.phone || '—'}</Text>
              <Text style={styles.infoLabel}>رقم الهاتف</Text>
            </View>
            <MaterialIcons name="phone" size={22} color={COLORS.primary} />
          </View>
        </View>

        {/* Address Information */}
        {(order.shipping_address || (order.billing_address && order.status !== 'processing')) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>العناوين</Text>
            {order.shipping_address && (
              <View style={styles.infoRow}>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>عنوان الشحن</Text>
                  <Text style={styles.infoValue}>{order.shipping_address}</Text>
                </View>
                <MaterialIcons name="local-shipping" size={22} color={COLORS.primary} />
              </View>
            )}

          </View>
        )}

        {/* Notes */}
        {order.notes && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ملاحظات</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{order.notes}</Text>
              <MaterialIcons name="note" size={22} color={COLORS.primary} />
            </View>
          </View>
        )}


        {/* Order Items */}
        {order.items && Array.isArray(order.items) && order.items.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>العناصر المطلوبة ({order.items.length})</Text>
            {order.items.map((item: any, index: number) => (
              <View key={item.id || index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product?.name || `منتج #${item.product_id}`}</Text>
                    <Text style={styles.itemQuantity}>الكمية: {item.quantity}</Text>
                  </View>
                  {(() => {
                    const imageUrl = getImageUrl(item.product?.image_url || item.product?.image || item.product?.main_image);
                    return imageUrl ? (
                      <Image 
                        source={imageUrl}
                        style={styles.itemImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                        <MaterialIcons name="image" size={24} color={COLORS.gray[400]} />
                      </View>
                    );
                  })()}
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemPriceLabel}>سعر الوحدة</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.unit_price || 0)}</Text>
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTotalLabel}>المجموع</Text>
                  <Text style={styles.itemTotal}>{formatPrice(item.total_price || 0)}</Text>
                </View>


              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        {order.status === 'pending' && (
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <MaterialIcons name="delete" size={20} color={COLORS.white} />
              <Text style={styles.deleteButtonText}>حذف الطلب</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Deleted Order Notice */}
        {order.status === 'deleted' && (
          <View style={styles.deletedNotice}>
            <MaterialIcons name="info" size={20} color={COLORS.gray[600]} />
            <Text style={styles.deletedNoticeText}>هذا الطلب تم حذفه</Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
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
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerSpacer: {
    width: 44,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },


  // Order Header Card
  orderHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  orderHeaderTop: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  orderInfo: {
    flex: 1,
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  orderNumberContainer: {
    alignItems: 'flex-end',
  },
  orderNumberLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray[500],
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginBottom: 4,
    textAlign: 'right',
    letterSpacing: 0.3,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize['base'],
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    letterSpacing: 0.5,
  },
  orderDateContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    minWidth: 120,
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginVertical: SPACING.lg,
  },
  orderSummary: {
    gap: SPACING.sm,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.gray[700],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginBottom: SPACING.xs,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'left',
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.gray[800],
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    textAlign: 'right',
  },
  totalRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'left',
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'right',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.lg,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    marginTop: SPACING.xs / 2,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'right',
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[800],
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
  },

  // Notes
  notesContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  notesText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[700],
    marginLeft: SPACING.md,
    textAlign: 'right',
    lineHeight: TYPOGRAPHY.lineHeight.relaxed * TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },

  // Items
  itemCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  itemName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  itemQuantity: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.white,
  },
  itemImagePlaceholder: {
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderStyle: 'dashed',
  },
  itemDetails: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  itemPriceLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'left',
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[800],
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontWeight: '600',
    textAlign: 'right',
  },
  itemTotalLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    textAlign: 'left',
  },
  itemTotal: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'right',
  },
  itemNotes: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  itemNotesLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  itemNotesText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[700],
    textAlign: 'right',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },

  // Actions
  actionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  actionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  actionDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    marginBottom: SPACING.lg,
    textAlign: 'right',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger,
    gap: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  paymentButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.success,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  paymentButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    borderColor: COLORS.gray[400],
  },
  paymentButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },

  // Deleted Notice
  deletedNotice: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    gap: SPACING.sm,
  },
  deletedNoticeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.gray[600],
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Skeleton Styles
  skeletonOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  skeletonOrderSummary: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  skeletonInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  skeletonItemCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  skeletonItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  skeletonItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
});