import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { buildCartItemKey, useCartStore } from '../../store/useCartStore';
import { createOrder } from '../../utils/api';

const YELLOW = '#ffde9f';
const BROWN = '#2a1e1e';
const WHITE = '#ffffff';
const GRAY = '#9CA3AF';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const designs = useCartStore((s) => s.designs);
  const removeItem = useCartStore((s) => s.removeItem);
  const removeDesign = useCartStore((s) => s.removeDesign);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const total = useCartStore((s) => s.total)();
  const { user } = useAuthStore();
  const [creatingOrder, setCreatingOrder] = useState(false);

  const handleBackNavigation = () => {
    try {
      // Try to go back first
      if (router.canGoBack()) {
        router.back();
      } else {
        // If can't go back, navigate to home
        router.push('/(tabs)');
      }
    } catch (error) {
      console.log('Navigation error, going to home:', error);
      // Fallback to home if navigation fails
      router.push('/(tabs)');
    }
  };

  const handleBookAppointment = async () => {
    if (items.length === 0) {
      Alert.alert('خطأ', 'السلة فارغة. أضف منتجات أولاً');
      return;
    }

    // Check if user has phone number
    if (!user?.phone) {
      Alert.alert(
        'رقم الهاتف مطلوب',
        'يجب إضافة رقم الهاتف في الملف الشخصي لإنشاء طلب',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'إضافة رقم الهاتف', onPress: () => router.push('/profile' as any) }
        ]
      );
      return;
    }

    setCreatingOrder(true);
    try {
      // Create order from cart items
      const orderPayload = {
        items: items.map(item => ({
          product_id: parseInt(item.id),
          quantity: item.quantity,
          options: item.options ? Object.values(item.options)
            .filter(opt => opt && opt !== 'null' && opt !== '')
            .map(opt => parseInt(opt))
            .filter(opt => !isNaN(opt)) : undefined
        })),
        phone: user?.phone, // Use actual user phone
        notes: `طلب من السلة - ${items.length} منتج`
      };

      console.log('Creating order from cart:', orderPayload);
      const orderResult = await createOrder(orderPayload);
      console.log('Order created successfully:', orderResult);

      // Extract order ID from the response
      const orderId = orderResult?.data?.id || (orderResult as any)?.id;
      
      if (!orderId) {
        throw new Error('لم يتم إنشاء رقم الطلب');
      }

      // Navigate to create appointment with order ID
      router.push({
        pathname: '/create-appointment' as any,
        params: { orderId: orderId.toString() }
      });

    } catch (error: any) {
      console.error('Failed to create order:', error);
      
      let errorMessage = 'فشل في إنشاء الطلب. حاول مرة أخرى';
      
      if (error.message?.includes('Phone number is required')) {
        errorMessage = 'رقم الهاتف مطلوب. يرجى إضافة رقم الهاتف في الملف الشخصي';
      } else if (error.message?.includes('options')) {
        errorMessage = 'خطأ في خيارات المنتج. يرجى إزالة المنتج وإضافته مرة أخرى';
      }
      
      Alert.alert('خطأ', errorMessage, [
        { text: 'موافق', style: 'cancel' },
        ...(error.message?.includes('Phone number is required') ? [{
          text: 'إضافة رقم الهاتف',
          onPress: () => router.push('/profile' as any)
        }] : [])
      ]);
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Text style={styles.headerTitle}>السلة</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Designs Section */}
        {designs.map((design) => (
          <View key={design.id} style={styles.designCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{design.title}</Text>
            </View>
            
            <View style={styles.cardBody}>
              <Image
                source={{ uri: design.image_url }}
                style={styles.cardImage}
              />
              
              <View style={styles.cardDetails}>
                {design.description && (
                  <Text style={styles.optionsText}>
                    {design.description}
                  </Text>
                )}
                
                <TouchableOpacity
                  onPress={() => removeDesign(design.id)}
                  style={styles.deleteInline}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="delete-outline" size={15} color="#DC2626" />
                  <Text style={styles.deleteText}>حذف التصميم</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        
        {/* Products Section */}
        {items.map((item) => {
          const key = buildCartItemKey(item);
          return (
            <View key={key} style={styles.card}>
              {/* Header: title only (left aligned, smaller to fit) */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.name_ar || item.name}</Text>
              </View>

              {/* Body: image on the right, details on the left */}
              <View style={styles.cardBody}>
                <Image
                  source={{ uri: item.image || 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center&q=60' }}
                  style={styles.cardImage}
                />

                <View style={styles.cardDetails}>
                  {(item.description_ar || item.description) && (
                    <Text style={styles.optionsText}>
                      {item.description_ar || item.description}
                    </Text>
                  )}

                  {/* qty + delete in one row */}
                  <View style={styles.actionsRow}>
                    <View style={styles.qtyBox}>
                      <TouchableOpacity
                        onPress={() => updateQuantity(key, Math.max(1, item.quantity - 1))}
                        style={styles.qtyBtn}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="remove" size={18} color={WHITE} />
                      </TouchableOpacity>

                      <Text style={styles.qtyText}>{item.quantity}</Text>

                      <TouchableOpacity
                        onPress={() => updateQuantity(key, item.quantity + 1)}
                        style={styles.qtyBtn}
                        activeOpacity={0.8}
                      >
                        <MaterialIcons name="add" size={18} color={WHITE} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => removeItem(key)}
                      style={styles.deleteInline}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="delete-outline" size={15} color="#DC2626" />
                      <Text style={styles.deleteText}>حذف</Text>
                    </TouchableOpacity>
                  </View>

                  {/* price sits under actions, aligned to the left like the mock */}
                  <Text style={styles.price}>
                    <Text style={styles.currency}>ريال </Text>
                    {item.price}
                  </Text>
                </View>
              </View>

            </View>
          );
        })}

        {items.length === 0 && designs.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>سلتك فارغة</Text>
          </View>
        )}

        {items.length > 0 && (
          <View style={styles.totalSection}>
            <Text style={styles.totalAmount}>{total.toFixed(0)} ر.س</Text>
            <Text style={styles.totalLabel}>المجموع:</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {/* Add Design Button */}
        <TouchableOpacity 
          style={styles.addDesignBtn} 
          activeOpacity={0.85}
          onPress={() => router.push('/designs')}
        >
          <MaterialIcons name="palette" size={20} color={WHITE} />
          <Text style={styles.addDesignText}>اضافة تصاميم</Text>
        </TouchableOpacity>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.appointmentBtn, creatingOrder && { opacity: 0.6 }]}
            onPress={handleBookAppointment}
            activeOpacity={0.85}
            disabled={creatingOrder}
          >
            <MaterialIcons name="event" size={20} color={BROWN} />
            <Text style={styles.appointmentText}>
              {creatingOrder ? 'جاري إنشاء الطلب...' : 'احجز موعد'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            disabled={items.length === 0}
            style={[styles.checkoutBtn, items.length === 0 && { opacity: 0.6 }]}
            onPress={() => router.push('/checkout')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="shopping-bag" size={20} color={WHITE} />
            <Text style={styles.checkoutText}>الدفع</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16,
    position: 'relative',
  },
  headerTitle: { fontFamily: 'NotoSansArabic_800ExtraBold', fontSize: 20, color: BROWN, textAlign: 'center' },

  content: { padding: 10, paddingBottom: 100 },

  /* Card */
  card: {
    backgroundColor: YELLOW,
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3dcae',
  },

  /* Title */
  cardHeader: { marginBottom: 4 },
  cardTitle: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: BROWN,
    fontSize: 14,
    textAlign: 'left',
  },

  /* Body – image on right, text on left */
  cardBody: {
    flexDirection: 'row-reverse',    // puts image on the right
    alignItems: 'center',
    gap: 15,
  },
  cardImage: {
    width: 170,
    aspectRatio: 4 / 3,
    borderRadius: 12,
  },

  cardDetails: {
    flex: 1,
    gap: 10,
    justifyContent: 'flex-start',
  },
  optionsText: { color: BROWN, opacity: 0.85, lineHeight: 18, textAlign: 'center' },

  /* Qty + Delete row */
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    overflow: 'hidden',
  },
  qtyBtn: { backgroundColor: BROWN, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyText: { paddingHorizontal: 12, fontFamily: 'NotoSansArabic_700Bold', color: BROWN },

  deleteInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  deleteText: { color: '#DC2626', fontFamily: 'NotoSansArabic_700Bold', fontSize: 10 },

  /* Price under actions, left aligned */
  price: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: BROWN,
    fontSize: 18,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  currency: { fontFamily: 'NotoSansArabic_700Bold', fontSize: 12, color: BROWN, opacity: 0.9 },

  /* Add Design button */
  addDesignBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addDesignText: { 
    color: WHITE, 
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16
  },

  /* Design card */
  designCard: {
    backgroundColor: '#E8F4FF',
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },

  /* Empty + footer */
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: GRAY, fontFamily: 'NotoSansArabic_700Bold' },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  totalLabel: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
    color: BROWN,
  },
  totalAmount: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    fontSize: 18,
    color: BROWN,
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: 'transparent' },
  buttonsContainer: { flexDirection: 'row', gap: 12 },
  appointmentBtn: { 
    backgroundColor: YELLOW, 
    borderRadius: 12, 
    height: 56, 
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row', 
    gap: 8,
    borderWidth: 1,
    borderColor: BROWN,
  },
  appointmentText: { color: BROWN, fontFamily: 'NotoSansArabic_800ExtraBold', fontSize: 16 },
  checkoutBtn: { backgroundColor: BROWN, borderRadius: 12, height: 56, flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  checkoutText: { color: WHITE, fontFamily: 'NotoSansArabic_800ExtraBold', fontSize: 16 },
});
