import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AddressFormBottomSheet from '../components/AddressFormBottomSheet';
import AuthBottomSheet from '../components/AuthBottomSheet';
import { ErrorState } from '../components/ErrorState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useAuthPrompt } from '../hooks/useAuthPrompt';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { Address, createOrder, getAddresses, getImageUrl, getOrderById, initiatePayment } from '../utils/api';

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

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string; mode?: string }>();
  const { user } = useAuthStore();
  const { authBottomSheetRef, customMessage } = useAuthPrompt();
  
  // Bottom sheet refs
  const addressFormBottomSheetRef = useRef<BottomSheetModal>(null);
  
  
  // Check if we're paying for an existing order
  const isPaymentMode = params.mode === 'payment' && !!params.orderId;
  
  // Order data (for payment mode)
  const [order, setOrder] = useState<any>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  
  // Cart data (for create mode)
  const items = useCartStore((s) => s.items);
  const loading = useCartStore((s) => s.loading);
  const error = useCartStore((s) => s.error);
  const loadCartItems = useCartStore((s) => s.loadCartItems);
  
  // Form state
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);

  // Load existing order for payment
  const loadOrder = async (orderId: string) => {
    setOrderLoading(true);
    setOrderError(null);
    try {
      const result = await getOrderById(orderId);
      setOrder(result.data);
    } catch (err: any) {
      setOrderError(err.message || 'فشل تحميل الطلب');
    } finally {
      setOrderLoading(false);
    }
  };

  // Load saved addresses
  const loadAddresses = useCallback(async () => {
    try {
      const result = await getAddresses();
      setAddresses(result);
      
      // Auto-select default address
      const defaultAddr = result.find(addr => addr.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
        setShippingAddress(defaultAddr.address_line);
        setPhone(defaultAddr.contact_phone);
      }
    } catch (error) {
    }
  }, []);

  const handleAddNewAddress = () => {
    addressFormBottomSheetRef.current?.present();
  };

  const handleAddressFormSuccess = (address: Address) => {
    // Refresh addresses list and select the new address
    loadAddresses().then(() => {
      setSelectedAddress(address);
      setShippingAddress(address.address_line);
      setPhone(address.contact_phone);
    });
  };

  // Load order or cart based on mode
  useEffect(() => {
    if (user) {
      if (isPaymentMode && params.orderId) {
        loadOrder(params.orderId);
      } else {
        loadCartItems();
        loadAddresses();
      }
    }
  }, [user, isPaymentMode, params.orderId, loadCartItems, loadAddresses]);


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(price);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.15; // 15% VAT
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };




  const handleCreateOrder = async () => {
    if (!user) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    // Payment mode - initiate payment for existing order
    if (isPaymentMode && order) {
      setCreatingOrder(true);
      try {
        const paymentResult = await initiatePayment(order.id);
        
        if (paymentResult?.data?.payment_url) {
          // Navigate to payment webview
          router.push({
            pathname: '/payment/webview' as any,
            params: { 
              orderId: order.id.toString(),
              paymentUrl: paymentResult.data.payment_url
            }
          });
        } else {
          Alert.alert('خطأ', 'فشل في الحصول على رابط الدفع');
        }
      } catch (error: any) {
        Alert.alert('خطأ', error.message || 'فشل في بدء عملية الدفع');
      } finally {
        setCreatingOrder(false);
      }
      return;
    }

    // Create mode - create new order from cart
    if (items.length === 0) {
      Alert.alert('خطأ', 'السلة فارغة');
      return;
    }

    if (!selectedAddress && !shippingAddress.trim()) {
      Alert.alert('خطأ', 'عنوان الشحن مطلوب');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('خطأ', 'رقم الهاتف مطلوب');
      return;
    }

    setCreatingOrder(true);
    try {
      const orderPayload: any = {
        items: items.map(item => ({
          product_id: parseInt(item.id),
          quantity: item.quantity,
          unit_price: item.price || 0,
          total_price: (item.price || 0) * item.quantity,
          options: item.options ? Object.values(item.options)
            .filter(opt => opt && opt !== 'null' && opt !== '')
            .map(opt => parseInt(opt))
            .filter(opt => !isNaN(opt)) : undefined
        })),
        phone: phone.trim(),
        notes: notes.trim() || `طلب من السلة - ${items.length} منتج`
      };

      // Use selected address if available
      if (selectedAddress) {
        orderPayload.address_id = selectedAddress.id;
      } else {
        // Fallback to manual address input
        orderPayload.shipping_address = shippingAddress.trim();
        orderPayload.billing_address = shippingAddress.trim();
      }

      const orderResult = await createOrder(orderPayload);

      // Extract order ID from the response
      const orderId = orderResult?.data?.id || (orderResult as any)?.id;
      
      if (!orderId) {
        throw new Error('لم يتم إنشاء رقم الطلب');
      }

      // Get payment URL from API
      const paymentResult = await initiatePayment(orderId);
      
      if (paymentResult?.data?.payment_url) {
        // Navigate to payment webview with the actual payment URL
        router.push({
          pathname: '/payment/webview' as any,
          params: { 
            orderId: orderId.toString(),
            paymentUrl: paymentResult.data.payment_url
          }
        });
      } else {
        throw new Error('فشل في الحصول على رابط الدفع');
      }

    } catch (error: any) {
      
      let errorMessage = 'فشل في إنشاء الطلب. حاول مرة أخرى';
      
      if (error.message?.includes('Phone number is required')) {
        errorMessage = 'رقم الهاتف مطلوب';
      } else if (error.message?.includes('address')) {
        errorMessage = 'عنوان الشحن مطلوب';
      }
      
      Alert.alert('خطأ', errorMessage);
    } finally {
      setCreatingOrder(false);
    }
  };

  // Loading states
  if (isPaymentMode && orderLoading) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <LoadingSpinner 
          fullScreen 
          text="جاري تحميل الطلب..." 
          color={COLORS.primary}
        />
      </SafeAreaWrapper>
    );
  }

  if (!isPaymentMode && loading) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <LoadingSpinner 
          fullScreen 
          text="جاري تحميل السلة..." 
          color={COLORS.primary}
        />
      </SafeAreaWrapper>
    );
  }

  // Error states
  if (isPaymentMode && orderError) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <ErrorState
          title="حدث خطأ"
          message={orderError}
          onRetry={() => params.orderId && loadOrder(params.orderId)}
          retryText="إعادة المحاولة"
          fullScreen
        />
      </SafeAreaWrapper>
    );
  }

  if (!isPaymentMode && error) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <ErrorState
          title="حدث خطأ"
          message={error}
          onRetry={() => loadCartItems()}
          retryText="إعادة المحاولة"
          fullScreen
        />
      </SafeAreaWrapper>
    );
  }

  // Empty states
  if (isPaymentMode && !order) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <ErrorState
          title="لم يتم العثور على الطلب"
          message="الطلب المطلوب غير موجود"
          onRetry={() => router.back()}
          retryText="العودة"
          iconName="shopping-bag"
          fullScreen
        />
      </SafeAreaWrapper>
    );
  }

  if (!isPaymentMode && items.length === 0) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <ErrorState
          title="السلة فارغة"
          message="أضف منتجات إلى السلة أولاً"
          onRetry={() => router.push('/(tabs)/cart')}
          retryText="العودة للسلة"
          iconName="shopping-cart"
          fullScreen
        />
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={COLORS.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isPaymentMode ? 'دفع الطلب' : 'إتمام الطلب'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary for Payment Mode */}
        {isPaymentMode && order && (
          <>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>ملخص الطلب</Text>
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>رقم الطلب</Text>
                <Text style={styles.orderSummaryValue}>#{order.order_number || order.id}</Text>
              </View>
              <View style={styles.orderSummaryRow}>
                <Text style={styles.orderSummaryLabel}>الحالة</Text>
                <Text style={styles.orderSummaryValue}>{order.status === 'confirmed' ? 'مؤكد' : order.status}</Text>
              </View>
            </View>

            {/* Shipping Address for Payment Mode */}
            {order.shipping_address && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>عنوان التسليم</Text>
                
                {order.shipping_contact_name && (
                  <View style={styles.addressDetailRow}>
                    <MaterialIcons name="person" size={18} color={COLORS.primary} />
                    <Text style={styles.addressDetailLabel}>جهة الاتصال</Text>
                    <Text style={styles.addressDetailValue}>{order.shipping_contact_name}</Text>
                  </View>
                )}
                
                {order.shipping_contact_phone && (
                  <View style={styles.addressDetailRow}>
                    <MaterialIcons name="phone" size={18} color={COLORS.primary} />
                    <Text style={styles.addressDetailLabel}>الهاتف</Text>
                    <Text style={styles.addressDetailValue}>{order.shipping_contact_phone}</Text>
                  </View>
                )}
                
                <View style={styles.addressDetailRow}>
                  <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
                  <Text style={styles.addressDetailLabel}>العنوان</Text>
                  <Text style={styles.addressDetailValue}>
                    {order.shipping_address}
                    {order.shipping_district && `, ${order.shipping_district}`}
                    {order.shipping_city && `, ${order.shipping_city}`}
                  </Text>
                </View>

                {order.shipping_delivery_instruction && (
                  <View style={styles.addressDetailRow}>
                    <MaterialIcons 
                      name={order.shipping_delivery_instruction === 'hand_to_me' ? 'pan-tool' : 'place'} 
                      size={18} 
                      color={COLORS.primary} 
                    />
                    <Text style={styles.addressDetailLabel}>تعليمات التسليم</Text>
                    <Text style={styles.addressDetailValue}>
                      {order.shipping_delivery_instruction === 'hand_to_me' 
                        ? 'تسليم باليد' 
                        : `ترك عند: ${order.shipping_drop_off_location || 'موقع محدد'}`
                      }
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Address Section */}
        {isPaymentMode && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>عنوان التسليم</Text>
              <TouchableOpacity
                style={styles.manageAddressesButton}
                onPress={() => router.push('/addresses')}
              >
                <MaterialIcons name="settings" size={18} color={COLORS.primary} />
                <Text style={styles.manageAddressesText}>إدارة العناوين</Text>
              </TouchableOpacity>
            </View>
          
            {/* Address Options with Radio Buttons */}
            {(() => {
              return null;
            })()}
            {addresses.length > 0 ? (
              <>
                {/* Saved Addresses */}
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressOption,
                      selectedAddress?.id === address.id && styles.addressOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedAddress(address);
                      setShippingAddress(address.address_line);
                      setPhone(address.contact_phone);
                    }}
                  >
                    <View style={styles.radioCircle}>
                      {selectedAddress?.id === address.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.addressOptionContent}>
                      <View style={styles.addressOptionHeader}>
                        <Text style={styles.addressOptionName}>
                          {address.name || 'عنوان'}
                        </Text>
                        {address.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>افتراضي</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.addressOptionDetail}>
                        <MaterialIcons name="person" size={14} color={COLORS.gray[500]} /> {address.contact_name}
                      </Text>
                      <Text style={styles.addressOptionDetail}>
                        <MaterialIcons name="phone" size={14} color={COLORS.gray[500]} /> {address.contact_phone}
                      </Text>
                      <Text style={styles.addressOptionText} numberOfLines={2}>
                        {address.address_line}
                        {address.district && `, ${address.district}`}
                        {address.city && `, ${address.city}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                
                {/* Add New Address Button */}
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={handleAddNewAddress}
                >
                  <MaterialIcons name="add-circle-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.addAddressText}>إضافة عنوان جديد</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* No Addresses - Show Add Button */}
                <View style={styles.noAddressesContainer}>
                  <MaterialIcons name="location-off" size={48} color={COLORS.gray[400]} />
                  <Text style={styles.noAddressesText}>لا توجد عناوين محفوظة</Text>
                  <TouchableOpacity
                    style={styles.addFirstAddressButton}
                    onPress={handleAddNewAddress}
                  >
                    <MaterialIcons name="add" size={20} color={COLORS.white} />
                    <Text style={styles.addFirstAddressButtonText}>إضافة عنوان</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Fallback: Manual Address Input */}
                <View style={styles.manualAddressSection}>
                  <Text style={styles.orText}>أو أدخل العنوان يدوياً</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>عنوان الشحن *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={shippingAddress}
                      onChangeText={setShippingAddress}
                      placeholder="أدخل عنوان الشحن"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>رقم الهاتف *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="أدخل رقم الهاتف"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </>
            )}
            
            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ملاحظات إضافية</Text>
              <TextInput
                style={styles.textInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="أي ملاحظات للطلب (اختياري)"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>
        )}

        {/* Items Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            العناصر المطلوبة ({isPaymentMode ? (order?.items?.length || 0) : items.length})
          </Text>
          
          {/* Show order items in payment mode */}
          {isPaymentMode && order?.items && order.items.map((item: any, index: number) => {
            // Enhanced image URL handling
            const imagePath = item.product?.image_url || 
                             item.product?.image || 
                             item.product?.main_image ||
                             item.product?.images?.[0] ||
                             item.image_url;
            const imageUrl = getImageUrl(imagePath);
            const productName = item.product?.name_ar || item.product?.name || `منتج #${item.product_id}`;
            
            
            return (
              <View key={item.id || index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{productName}</Text>
                    <Text style={styles.itemQuantity}>الكمية: {item.quantity}</Text>
                  </View>
                  {imageUrl ? (
                    <Image 
                      source={{ uri: imageUrl }} 
                      style={styles.itemImage}
                      resizeMode="cover"
                      onError={() => {
                      }}
                    />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <MaterialIcons name="image" size={24} color={COLORS.gray[400]} />
                    </View>
                  )}
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
            );
          })}
          
          {/* Show cart items in create mode */}
          {!isPaymentMode && items.map((item, index) => {
            // Enhanced image URL handling for cart items
            const imagePath = item.image || 
                             (item as any).image_url || 
                             (item as any).main_image ||
                             (item as any).images?.[0];
            const imageUrl = getImageUrl(imagePath);
            const productName = item.name_ar || item.name;
            
            
            return (
              <View key={item.id || index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{productName}</Text>
                    <Text style={styles.itemQuantity}>الكمية: {item.quantity}</Text>
                  </View>
                  {imageUrl ? (
                    <Image 
                      source={{ uri: imageUrl }} 
                      style={styles.itemImage}
                      resizeMode="cover"
                      onError={() => {
                      }}
                    />
                  ) : (
                    <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                      <MaterialIcons name="image" size={24} color={COLORS.gray[400]} />
                    </View>
                  )}
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemPriceLabel}>سعر الوحدة</Text>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                </View>
                
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTotalLabel}>المجموع</Text>
                  <Text style={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Price Summary Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ملخص السعر</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>المبلغ الفرعي</Text>
            <Text style={styles.summaryValue}>
              {isPaymentMode ? formatPrice(order?.subtotal || 0) : formatPrice(calculateSubtotal())}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>الضريبة (15%)</Text>
            <Text style={styles.summaryValue}>
              {isPaymentMode ? formatPrice(order?.tax || 0) : formatPrice(calculateTax())}
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>المبلغ الإجمالي</Text>
            <Text style={styles.totalValue}>
              {isPaymentMode ? formatPrice(order?.total || 0) : formatPrice(calculateTotal())}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Payment Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.paymentButton, creatingOrder && styles.paymentButtonDisabled]} 
          onPress={handleCreateOrder}
          disabled={creatingOrder}
        >
          {creatingOrder ? (
            <LoadingSpinner size="small" color={COLORS.white} />
          ) : (
            <MaterialIcons name="payment" size={20} color={COLORS.white} />
          )}
          <Text style={styles.paymentButtonText}>
            {creatingOrder 
              ? (isPaymentMode ? 'جاري التحضير...' : 'جاري إنشاء الطلب...') 
              : (isPaymentMode 
                  ? `دفع ${formatPrice(order?.total || 0)}` 
                  : `دفع ${formatPrice(calculateTotal())}`
                )
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auth Bottom Sheet */}
      <AuthBottomSheet
        bottomSheetRef={authBottomSheetRef}
        title="تسجيل الدخول مطلوب"
        message={customMessage || "يجب تسجيل الدخول أولاً للوصول إلى هذه الميزة"}
      />

      {/* Address Form Bottom Sheet */}
      <AddressFormBottomSheet
        bottomSheetRef={addressFormBottomSheetRef}
        onSuccess={handleAddressFormSuccess}
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
    padding: SPACING.lg,
    paddingBottom: SPACING['4xl'],
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
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  manageAddressesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  manageAddressesText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Order Summary (for payment mode)
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  orderSummaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    textAlign: 'right',
  },
  orderSummaryValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'left',
  },

  // Address Details (for payment mode)
  addressDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  addressDetailLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    fontWeight: '600',
    minWidth: 80,
  },
  addressDetailValue: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[800],
    textAlign: 'right',
  },

  // Address Options
  addressOption: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  addressOptionSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + '10',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  addressOptionContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  addressOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressOptionName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
  defaultBadge: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  defaultBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  addressOptionDetail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
  },
  addressOptionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[700],
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: '600',
  },
  noAddressesContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  noAddressesText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
  },
  addFirstAddressButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  addFirstAddressButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.white,
    fontWeight: '600',
  },
  manualAddressSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  orText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.md,
  },

  // Location Button
  locationButton: {
    backgroundColor: COLORS.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
  },
  locationButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.sm,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Input Groups
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[700],
    backgroundColor: COLORS.white,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    minHeight: 44,
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
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  itemQuantity: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    textAlign: 'right',
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  itemPrice: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[700],
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  itemTotalLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  itemTotal: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.primary,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },

  // Price Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },

  // Bottom Container
  bottomContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    ...SHADOWS.lg,
  },
  paymentButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  paymentButtonDisabled: {
    backgroundColor: COLORS.gray[400],
    borderColor: COLORS.gray[400],
  },
  paymentButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.sm,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Address Selection Styles
  selectedAddressCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    marginBottom: SPACING.md,
  },
  selectedAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  selectedAddressInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  selectedAddressName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  selectedAddressDetails: {
    gap: SPACING.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  contactText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  addressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[700],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    flex: 1,
  },
  selectAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
  },
  selectAddressButtonText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    textAlign: 'center',
  },
});