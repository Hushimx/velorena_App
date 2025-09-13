import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useOrder } from '../../hooks/useOrder';

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
  shipped: { color: '#d1ecf1', text: 'تم الشحن', icon: '🚚', textColor: '#0c5460' },
  delivered: { color: '#d4edda', text: 'تم التوصيل', icon: '📦', textColor: '#155724' },
  cancelled: { color: '#f8d7da', text: 'ملغي', icon: '❌', textColor: '#721c24' },
  deleted: { color: COLORS.gray[100], text: 'محذوف', icon: '🗑️', textColor: COLORS.gray[600] },
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: o, loading, error, remove } = useOrder(id);
  const router = useRouter();

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getShortOrderNumber = (ord: any) => {
    const raw = String(ord?.order_number ?? ord?.id ?? '');
    const digitsOnly = raw.replace(/\D+/g, '');
    const firstSix = (digitsOnly || raw).slice(0, 6);
    return firstSix;
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
                    const ok = await remove();
                    if (ok) { 
                      Alert.alert('تم الحذف', 'تم حذف الطلب بنجاح', [
                        {
                          text: 'تم',
                          onPress: () => {
                            // Navigate to orders page with refresh parameter
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>جاري تحميل تفاصيل الطلب...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color={COLORS.danger} />
          <Text style={styles.errorTitle}>حدث خطأ</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/orders' as any)}>
            <Text style={styles.retryButtonText}>العودة للطلبات</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!o) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="shopping-bag" size={64} color={COLORS.gray[400]} />
          <Text style={styles.errorTitle}>لم يتم العثور على الطلب</Text>
          <Text style={styles.errorText}>الطلب المطلوب غير موجود أو تم حذفه</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/orders' as any)}>
            <Text style={styles.retryButtonText}>العودة للطلبات</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(o.status);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary Banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryBannerRow}>
        </View>
        <View style={styles.summaryTwoCols}>
          {/* Right column */}
          <View style={[styles.summaryCol, styles.summaryColRight]}>
            <View style={styles.kvRow}>
              <MaterialIcons name="inventory" size={20} color={COLORS.primary} style={styles.kvIcon} />
              <Text style={styles.kvKey}>حالة الطلب :</Text>
              <Text style={styles.kvValue}>{o.status_text ?? statusConfig.text}</Text>
            </View>
            <View style={styles.kvRow}>
              <MaterialIcons name="phone" size={20} color={COLORS.primary} style={styles.kvIcon} />
              <Text style={styles.kvKey}>الهاتف :</Text>
              <Text style={styles.kvValue}>{o.phone ?? '—'}</Text>
            </View>
            <View style={styles.kvRow}>
              <MaterialIcons name="attach-money" size={20} color={COLORS.primary} style={styles.kvIcon} />
              <Text style={styles.kvKey}>المبلغ الإجمالي :</Text>
              <Text style={styles.kvValue}>{formatPrice(o.total ?? 0)}</Text>
            </View>
          </View>

          {/* Left column */}
          <View style={[styles.summaryCol, styles.summaryColLeft]}>
            <View style={styles.kvRow}>
              <MaterialIcons name="confirmation-number" size={20} color={COLORS.primary} style={styles.kvIcon} />
              <Text style={styles.kvKey}>رقم الطلب :</Text>
              <Text style={[styles.kvValue, styles.kvValueOrderId]}>{getShortOrderNumber(o)}</Text>
            </View>
            <View style={styles.kvRow}>
              <MaterialIcons name="event" size={20} color={COLORS.primary} style={styles.kvIcon} />
              <Text style={styles.kvKey}>التاريخ :</Text>
              <Text style={styles.kvValue}>{o.created_at ? formatDate(o.created_at) : '—'}</Text>
            </View>
            <View style={styles.kvRow}>
              <MaterialIcons name="location-on" size={20} color={COLORS.primary} style={styles.kvIcon} />
              <Text style={styles.kvKey}>العنوان :</Text>
              <Text style={styles.kvValue}>{o.shipping_address ?? '—'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        <View style={styles.stepperTrack} />
        {(() => {
          const step = o.status === 'delivered' ? 2 : o.status === 'shipped' || o.status === 'confirmed' ? 1 : 0;
          const progress = step === 0 ? '0%' : step === 1 ? '50%' : '100%';
          return <View style={[styles.stepperTrackActive, { width: progress }]} />;
        })()}
        {['قيد التنفيذ','في الطريق','تم التسليم'].map((label, i) => {
          const step = o.status === 'delivered' ? 2 : o.status === 'shipped' || o.status === 'confirmed' ? 1 : 0;
          const active = i <= step;
          return (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepCircle, active && styles.stepCircleActive]}>
                <MaterialIcons name={i===0?'task-alt':i===1?'local-shipping':'done-all'} size={20} color={active?COLORS.white:COLORS.gray[400]} />
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Card */}
        <View style={styles.orderCard}>
          {/* Order Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderNumberContainer}>
              <Text style={styles.orderNumber}>طلب #{String(o.order_number ?? o.id ?? '')}</Text>
              <Text style={styles.orderDate}>
                {o.created_at ? formatDate(o.created_at) : ''}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
              <Text style={[styles.statusText, { color: statusConfig.textColor }]}>{statusConfig.text}</Text>
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>ملخص الطلب</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <MaterialIcons name="attach-money" size={20} color={COLORS.primary} />
                <Text style={styles.summaryLabel}>المبلغ الإجمالي</Text>
                <Text style={styles.summaryValue}>{formatPrice(o.total || 0)}</Text>
              </View>
              {o.phone && (
                <View style={styles.summaryItem}>
                  <MaterialIcons name="phone" size={20} color={COLORS.primary} />
                  <Text style={styles.summaryLabel}>رقم الهاتف</Text>
                  <Text style={styles.summaryValue}>{o.phone}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Addresses */}
          {(o.shipping_address || o.billing_address) && (
            <View style={styles.addressesSection}>
              <Text style={styles.sectionTitle}>العناوين</Text>
              {o.shipping_address && (
                <View style={styles.addressItem}>
                  <MaterialIcons name="local-shipping" size={20} color={COLORS.primary} />
                  <View style={styles.addressContent}>
                    <Text style={styles.addressLabel}>عنوان الشحن</Text>
                    <Text style={styles.addressValue}>{o.shipping_address}</Text>
                  </View>
                </View>
              )}
              {o.billing_address && (
                <View style={styles.addressItem}>
                  <MaterialIcons name="receipt" size={20} color={COLORS.primary} />
                  <View style={styles.addressContent}>
                    <Text style={styles.addressLabel}>عنوان الفاتورة</Text>
                    <Text style={styles.addressValue}>{o.billing_address}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Notes */}
          {o.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>ملاحظات</Text>
              <View style={styles.notesContainer}>
                <MaterialIcons name="note" size={20} color={COLORS.primary} />
                <Text style={styles.notesText}>{o.notes}</Text>
              </View>
            </View>
          )}

          {/* Order Items */}
          {(o.items ?? o.products ?? []).length > 0 && (
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>العناصر المطلوبة</Text>
              {(o.items ?? o.products ?? []).map((it: any, idx: number) => (
                <View key={String(it.id ?? idx)} style={styles.itemCardEnhanced}>
                  <View style={styles.itemTopRow}><MaterialIcons name="favorite-border" size={18} color={COLORS.gray[500]} /></View>
                  <View style={styles.itemMainRow}>
                    <View style={styles.itemInfoCol}>
                      <Text style={styles.itemTitle}>{it.name ?? `منتج #${it.product_id}`}</Text>
                      <Text style={styles.itemSub}>{`${idx+1}-${String(o.order_number ?? o.id ?? '')}`}</Text>
                      <Text style={styles.itemSub}>{`الكمية: ${it.quantity ?? 1}`}</Text>
                      <View style={styles.specRow}><Text style={styles.specValue}>{it.material_type ?? '—'}</Text><Text style={styles.specKey}>نوع المادة</Text></View>
                      <View style={styles.specRow}><Text style={styles.specValue}>{it.bag_size ?? '—'}</Text><Text style={styles.specKey}>حجم الكيس</Text></View>
                      <View style={styles.specRow}><Text style={styles.specValue}>{it.print_location ?? '—'}</Text><Text style={styles.specKey}>مكان الطباعة</Text></View>
                      {Array.isArray(it.colors) && it.colors.length > 0 && (
                        <View style={styles.colorsRow}>
                          <Text style={styles.specKey}>أكواد الألوان</Text>
                          <View style={styles.colorChips}>
                            {it.colors.map((c: any, i2: number) => (
                              <View key={String(c?.id ?? c ?? i2)} style={styles.colorChip}><Text style={styles.colorChipText}>{String(c?.code ?? c)}</Text></View>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                    {(() => {
                      const uri = String(it.image_url || it.image || it.thumbnail || '');
                      return uri ? (
                        <Image source={{ uri }} style={styles.itemImage} />
                      ) : (
                        <View style={[styles.itemImage, { backgroundColor: COLORS.gray[200] }]} />
                      );
                    })()}
                  </View>

                  <View style={styles.itemActionBar}>
                    <TouchableOpacity style={styles.dropdownBar}>
                      <MaterialIcons name="expand-more" size={18} color={COLORS.white} />
                      <Text style={styles.dropdownText}>عرض الخيارات</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.itemDelete}>
                      <MaterialIcons name="delete" size={18} color={COLORS.white} />
                      <Text style={styles.itemDeleteText}>إلغاء</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemPriceBig}>{formatPrice((it.price ?? 0) * (it.quantity ?? 1))}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          {o.status === 'pending' && (
            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <MaterialIcons name="delete" size={20} color={COLORS.white} />
                <Text style={styles.deleteButtonText}>حذف الطلب</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Deleted Order Notice */}
          {o.status === 'deleted' && (
            <View style={styles.deletedNotice}>
              <MaterialIcons name="info" size={20} color={COLORS.gray[600]} />
              <Text style={styles.deletedNoticeText}>هذا الطلب تم حذفه</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    backgroundColor: '#fefefe', // Soft white
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
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
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['4xl'], // Extra bottom padding
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['4xl'],
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    marginTop: SPACING.lg,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['4xl'],
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    marginBottom: SPACING['2xl'],
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  retryButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Order Card
  orderCard: {
    backgroundColor: '#fefefe', // Soft white
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#f0f0f0', // Soft gray border
    ...SHADOWS.sm,
  },

  // Order Header
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  orderNumberContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  orderNumber: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    textAlign: 'right',
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Sections
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Summary Section
  summarySection: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  summaryBanner: {
    marginHorizontal: 15,
    marginTop: 12,
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: 14,
    shadowColor: COLORS.gray[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryBannerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryBannerGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryTwoCols: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flexBasis: '48%',
    maxWidth: '48%',
    gap: 8,
  },
  summaryColRight: {
    paddingLeft: 8,
  },
  summaryColLeft: {
    paddingRight: 8,
  },
  kvRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  kvIcon: {
    marginLeft: 4,
  },
  kvPair: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    width: '48%',
    justifyContent: 'flex-end',
  },
  kvKey: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '800',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },
  kvValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  kvValueOrderId: {
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '70%',
  },

  // Stepper
  stepper: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    position: 'relative',
  },
  stepperTrack: {
    position: 'absolute',
    left: 25,
    right: 25,
    top: 16,
    height: 3,
    backgroundColor: COLORS.gray[300],
    zIndex: 1,
  },
  stepperTrackActive: {
    position: 'absolute',
    left: 25,
    top: 15,
    height: 5,
    backgroundColor: COLORS.primary,
    zIndex: 2,
    borderRadius: 3,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    minHeight: 48,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.gray[600],
    fontFamily: 'NotoSansArabic_400Regular',
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: 0,
    width: '100%',
    height: 3,
    backgroundColor: COLORS.gray[300],
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },

  // Addresses Section
  addressesSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
  },
  addressContent: {
    flex: 1,
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  addressValue: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'right',
    lineHeight: 20,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },

  // Notes Section
  notesSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[700],
    marginLeft: 12,
    textAlign: 'right',
    lineHeight: 20,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },

  // Items Section
  itemsSection: {
    marginBottom: 24,
  },
  itemCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemCardEnhanced: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  itemTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  itemMainRow: {
    marginTop: 8,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfoCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  itemSub: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  specRow: {
    marginTop: 6,
    flexDirection: 'row-reverse',
    gap: 6,
  },
  specKey: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  specValue: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  colorsRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  colorChips: {
    marginTop: 4,
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  colorChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  colorChipText: {
    fontSize: 11,
    color: COLORS.gray[700],
    fontFamily: 'NotoSansArabic_400Regular',
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    marginLeft: 8,
    backgroundColor: COLORS.white,
  },
  itemActionBar: {
    marginTop: 10,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  dropdownText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  itemDelete: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  itemDeleteText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  itemPriceBig: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'left',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  itemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'left',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  optionsContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  optionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  optionsText: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'right',
    lineHeight: 16,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },

  // Actions Section
  actionsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },

  // Deleted Notice
  deletedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: COLORS.gray[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  deletedNoticeText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginLeft: 8,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
});
