import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  pending: { color: '#fff3cd', text: 'قيد الانتظار', icon: '⏳', textColor: '#856404' },
  confirmed: { color: '#d4edda', text: 'مؤكد', icon: '✅', textColor: '#155724' },
  processing: { color: '#d1ecf1', text: 'قيد المعالجة', icon: '⚙️', textColor: '#0c5460' },
  shipped: { color: '#d1ecf1', text: 'تم الشحن', icon: '🚚', textColor: '#0c5460' },
  delivered: { color: '#d4edda', text: 'تم التوصيل', icon: '📦', textColor: '#155724' },
  cancelled: { color: '#f8d7da', text: 'ملغي', icon: '❌', textColor: '#721c24' },
  deleted: { color: COLORS.gray[100], text: 'محذوف', icon: '🗑️', textColor: COLORS.gray[600] },
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
    return new Intl.NumberFormat('ar-SA', {
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
              <MaterialIcons name="payment" size={20} color={COLORS.white} />
              <Text style={styles.paymentButtonText}>
                دفع الآن
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Order Header Card */}
        <View style={styles.orderHeaderCard}>
          <View style={styles.orderHeaderTop}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
              <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
                {statusConfig.text}
              </Text>
            </View>
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>طلب #{order.order_number || order.id}</Text>
              <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
            </View>
          </View>
          
          {/* Order Summary */}
          <View style={styles.orderSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>المبلغ الإجمالي</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.total || 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>المبلغ الفرعي</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.subtotal || 0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>الضريبة (15%)</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.tax || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>معلومات الاتصال</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color={COLORS.primary} />
            <Text style={styles.infoLabel}>رقم الهاتف</Text>
            <Text style={styles.infoValue}>{order.phone || '—'}</Text>
          </View>
        </View>

        {/* Address Information */}
        {(order.shipping_address || (order.billing_address && order.status !== 'processing')) && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>العناوين</Text>
            {order.shipping_address && (
              <View style={styles.infoRow}>
                <MaterialIcons name="local-shipping" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>عنوان الشحن</Text>
                <Text style={styles.infoValue}>{order.shipping_address}</Text>
              </View>
            )}
            {order.billing_address && order.status !== 'processing' && (
              <View style={styles.infoRow}>
                <MaterialIcons name="receipt" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>عنوان الفاتورة</Text>
                <Text style={styles.infoValue}>{order.billing_address}</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {order.notes && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>ملاحظات</Text>
            <View style={styles.notesContainer}>
              <MaterialIcons name="note" size={20} color={COLORS.primary} />
              <Text style={styles.notesText}>{order.notes}</Text>
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
                        source={{ uri: imageUrl }} 
                        style={styles.itemImage}
                        resizeMode="cover"
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

                {item.notes && (
                  <View style={styles.itemNotes}>
                    <Text style={styles.itemNotesLabel}>ملاحظات:</Text>
                    <Text style={styles.itemNotesText}>{item.notes}</Text>
                  </View>
                )}
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
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  orderHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 100,
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: TYPOGRAPHY.fontSize.base,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  orderSummary: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    marginLeft: SPACING.sm,
    marginRight: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  infoValue: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[700],
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },

  // Notes
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notesText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[700],
    marginLeft: SPACING.sm,
    textAlign: 'right',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  itemPriceLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[700],
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  itemTotalLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  itemTotal: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
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
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.sm,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  paymentButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.success,
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
    marginLeft: SPACING.sm,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },

  // Deleted Notice
  deletedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  deletedNoticeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginLeft: SPACING.sm,
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