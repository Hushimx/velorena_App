import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { createOrder, CreateOrderBody, getProductDetail } from '../utils/api';

const BROWN = '#2a1e1e';
const YELLOW = '#ffde9f';
const WHITE = '#fff';

export default function Checkout() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total)();
  const clear = useCartStore((s) => s.clear);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  
  

  const [shipping_address, setShip] = useState('');
  const [billing_address, setBill] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const buildPayload = (): CreateOrderBody => {
    console.log('🔍 Building payload from cart items:', items);
    
    const products = items.map((it: any) => {
      // Ensure we have a valid product_id
      const productId = Number(it.id);
      if (isNaN(productId) || productId <= 0) {
        console.error('❌ Invalid product ID:', it.id, 'for item:', it);
        return null;
      }
      
      const mappedItem = {
        product_id: productId,
        quantity: Number(it.quantity ?? 1),
        // If/when you store numeric option IDs in cart, map them here:
        // options: (it.selectedOptions || []).map((o: any) => Number(o.id ?? o._id))
      };
      
      console.log(`🔍 Mapped item: ${it.name} (ID: ${it.id}) -> product_id: ${mappedItem.product_id}, qty: ${mappedItem.quantity}`);
      return mappedItem;
    }).filter((item): item is { product_id: number; quantity: number } => item !== null); // Remove any null items
    
    // The backend expects 'items' instead of 'products'!
    const payload = { items: products, shipping_address, billing_address, phone, notes };
    
    console.log('📦 Final payload:', payload);
    console.log('📦 Product IDs being sent:', products.map(p => p.product_id));
    
    return payload;
  };
  
  // Validate that all products exist in the backend
  const validateProductsExist = async (): Promise<{ valid: boolean; invalidProducts: string[] }> => {
    const invalidProducts: string[] = [];
    
    for (const item of items) {
      try {
        const productId = Number(item.id);
        if (isNaN(productId) || productId <= 0) {
          invalidProducts.push(`${item.name} (Invalid ID: ${item.id})`);
          continue;
        }
        
        // Try to fetch the product from backend
        const product = await getProductDetail(String(productId));
        if (!product || !product.data) {
          invalidProducts.push(`${item.name} (ID: ${productId} - Not found in backend)`);
        }
      } catch (error: any) {
        console.error(`❌ Failed to validate product ${item.name} (ID: ${item.id}):`, error);
        invalidProducts.push(`${item.name} (ID: ${item.id} - ${error.message})`);
      }
    }
    
    return {
      valid: invalidProducts.length === 0,
      invalidProducts
    };
  };
  
  // Handle 419 CSRF/Session expired error
  const handle419Error = () => {
    Alert.alert('انتهت صلاحية الجلسة', 
      'انتهت صلاحية الجلسة أو رمز CSRF. يرجى إعادة تسجيل الدخول.',
      [
        {
          text: 'إعادة تسجيل الدخول',
          onPress: () => {
            logout();
            router.replace('/login');
          }
        },
        {
          text: 'إلغاء',
          style: 'cancel'
        }
      ]
    );
  };
  
  

  const onSubmit = async () => {
    if (!items.length) { 
      Alert.alert('السلة فارغة', 'يرجى إضافة منتجات إلى السلة أولاً'); 
      return; 
    }
    
    // Validate required fields
    if (!shipping_address.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان الشحن');
      return;
    }
    
    if (!phone.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return;
    }
    
         const payload = buildPayload();
     
          // Validate items array
     if (!payload.items || payload.items.length === 0) {
       console.error('❌ No valid items found in payload:', payload);
       Alert.alert('خطأ', 'لا توجد منتجات صالحة في السلة');
       return;
     }
     
     // Validate each item has valid product_id
     const invalidItems = payload.items.filter(p => !p.product_id || p.product_id <= 0);
     if (invalidItems.length > 0) {
       console.error('Invalid items found:', invalidItems);
       Alert.alert('خطأ', 'بعض المنتجات تحتوي على معرفات غير صالحة');
       return;
     }
    
         try {
       setPlacing(true);
       
       // Validate products exist before submitting
       console.log('🔍 Validating products before submission...');
       const validation = await validateProductsExist();
       if (!validation.valid) {
         Alert.alert('❌ Invalid Products', 
           `Cannot create order. The following products are invalid:\n\n${validation.invalidProducts.join('\n')}\n\nPlease remove invalid items from cart.`
         );
         return;
       }
       
       console.log('✅ Product validation passed, creating order...');
       const res = await createOrder(payload);
       if (res?.success) {
         Alert.alert('تم', res?.message || 'تم إنشاء الطلب بنجاح', [
           {
             text: 'عرض الطلبات',
             onPress: () => {
               clear?.();
               router.replace('/orders' as any);
             }
           },
           {
             text: 'العودة للرئيسية',
             onPress: () => {
               clear?.();
               router.replace('/(tabs)');
             }
           }
         ]);
       } else {
         Alert.alert('خطأ', res?.message || 'تعذر إنشاء الطلب');
       }
     } catch (e: any) { 
       console.error('Order creation error:', e);
       
       // Handle specific error cases
       if (e?.status === 419) {
         handle419Error();
       } else {
         Alert.alert('خطأ', e?.message || 'تعذر إنشاء الطلب'); 
       }
     } finally { 
       setPlacing(false); 
     }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <Text style={styles.h1}>تفاصيل الشحن والدفع</Text>
        <TextInput style={styles.input} placeholder='عنوان الشحن' value={shipping_address} onChangeText={setShip} />
        <TextInput style={styles.input} placeholder='عنوان الفاتورة' value={billing_address} onChangeText={setBill} />
        <TextInput style={styles.input} placeholder='الهاتف' value={phone} onChangeText={setPhone} keyboardType='phone-pad' />
        <TextInput style={[styles.input, { height: 100 }]} multiline placeholder='ملاحظات' value={notes} onChangeText={setNotes} />

        <View style={styles.totalRow}><Text style={styles.totalVal}>{total.toFixed(0)} ر.س</Text><Text style={styles.totalLbl}>الإجمالي:</Text></View>

        <TouchableOpacity disabled={placing} onPress={onSubmit} style={[styles.btn, placing && { opacity: 0.6 }]}>
          <Text style={styles.btnText}>{placing ? 'جارٍ المعالجة...' : 'تأكيد الطلب'}</Text>
        </TouchableOpacity>
        
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  h1: { color: BROWN, fontWeight: '800', fontSize: 18, textAlign: 'right', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: YELLOW, padding: 12, borderRadius: 12, marginVertical: 8 },
  totalLbl: { color: BROWN, fontWeight: '700' },
  totalVal: { color: BROWN, fontWeight: '800' },
  btn: { backgroundColor: BROWN, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText: { color: WHITE, fontWeight: '800' },
});
