import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, useIsAuthenticated, useUser } from '../../store/useAuthStore';
import { getCategories, getProducts, logoutUser } from '../../utils/api';

const YELLOW = '#ffde9f';
const YELLOW_DARK = '#f5d182';
const BROWN_DARK = '#2a1e1e';
const GRAY = '#9CA3AF';
const BRAND_BLUE = '#2a1e1e';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to extract image URI from various API structures
const getProductImageUri = (product: any): string => {
  // Use a more reliable placeholder service with a product-related image
  const fallbackImage = 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center&q=60';
  
  if (product.image && product.image !== 'https://via.placeholder.com/400x300' && !product.image.includes('via.placeholder.com')) {
    return product.image;
  } else if (product.main_image && product.main_image !== 'https://via.placeholder.com/400x300' && !product.main_image.includes('via.placeholder.com')) {
    return product.main_image;
  } else if (product.images && product.images.length > 0) {
    const firstImage = product.images[0];
    const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.image_url || firstImage?.url || firstImage);
    if (imageUrl && !imageUrl.includes('via.placeholder.com')) {
      return imageUrl;
    }
  } else if (product.product_images && product.product_images.length > 0) {
    const firstImage = product.product_images[0];
    const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage?.image_url || firstImage?.url || firstImage);
    if (imageUrl && !imageUrl.includes('via.placeholder.com')) {
      return imageUrl;
    }
  }
  
  return fallbackImage;
};

const categoryData = [
  {
    id: 'packaging',
    title: 'التعبئة و التغليف',
    iconName: 'box',
  },
  {
    id: 'catalogs',
    title: 'كتالوجات',
    iconName: 'book-open',
  },
  {
    id: 'notebooks',
    title: 'كراسات',
    iconName: 'book',
  },
  {
    id: 'flyers',
    title: 'فلاير',
    iconName: 'newspaper',
  },
] as const;


// Promo slides for carousel
const promoSlides = [
  {
    id: 's1',
    image: 'https://images.unsplash.com/photo-1567688535100-5dc79f1ca57e?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'عبوات التغليف',
    subtitle: 'استكشف أحدث تصاميم التغليف',
    discount: 'خصم 20%',
    bg: '#ffde9f'
  },
  {
    id: 's2',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0',
    title: 'كتالوجات مميزة',
    subtitle: 'أفكار مبتكرة لعرض منتجاتك',
    discount: 'وفر حتى 15%',
    bg: '#70F8A4FF'
  },
  {
    id: 's3',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0',
    title: 'دفاتر وأوراق',
    subtitle: 'جودة عالية وطباعة احترافية',
    discount: 'عروض خاصة',
    bg: '#87ADFDFF'
  },
  {
    id: 's4',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0',
    title: 'بطاقات دعوة',
    subtitle: 'تصاميم فريدة لمناسباتك الخاصة',
    discount: 'خصم 25%',
    bg: '#FFB6C1'
  },
  {
    id: 's5',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0',
    title: 'أغلفة هدايا',
    subtitle: 'أجمل التصاميم لتغليف هداياك',
    discount: 'عروض حصرية',
    bg: '#DDA0DD'
  },
];

export default function HomeScreen() {
  const appear = useRef(new Animated.Value(0)).current;
  const appearSlow = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [cats, setCats] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodErr, setProdErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Auth store usage
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { logout } = useAuthStore();

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(appear, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appearSlow, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [appear, appearSlow]);



  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutUser(); // Call backend logout if needed
            } catch (error) {
              console.warn('Logout API call failed:', error);
            } finally {
              logout(); // Clear local storage
              router.replace('/login');
            }
          }
        }
      ]
    );
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setCatLoading(true);
        const catRes = await getCategories({ page: 1, limit: 8, search }, ac.signal);
        setCats(catRes?.data?.data ?? []);
      } catch (e: any) {
        console.warn('Failed to load categories:', e?.message);
      } finally {
        setCatLoading(false);
      }
      try {
        setProdLoading(true);
        const prodRes = await getProducts({ page: 1, limit: 8, search }, ac.signal);
        setProducts(prodRes?.data?.data ?? []);
        setProdErr(null);
      } catch (e: any) {
        setProdErr(e?.message || 'فشل تحميل المنتجات');
      } finally {
        setProdLoading(false);
      }
    })();
    return () => ac.abort();
  }, [search]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        {isAuthenticated && user && (
          <Animated.View 
            className="bg-brand-yellow rounded-2xl mb-3 border border-brand-yellow-dark"
            style={{ 
              opacity: appear, 
              transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] 
            }}
          >
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-1 items-start">
                <Text className="text-base text-brand-brown font-bold text-left">
                  مرحباً، {user.full_name}
                </Text>
                <Text className="text-xs text-brand-brown font-medium mt-0.5 text-left">
                  {user.client_type === 'individual' ? 'حساب فردي' : 'حساب شركة'}
                </Text>
              </View>
              <TouchableOpacity 
                className="w-9 h-9 rounded-full bg-brand-brown items-center justify-center shadow-sm"
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={16} color={YELLOW} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Header Controls */}
        <Animated.View 
          className="flex-row items-center justify-between mb-4 px-1"
          style={{ 
            opacity: appear, 
            transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] 
          }}
        >
          <TouchableOpacity className="w-10 h-10 items-center justify-center">
            <MaterialIcons name="tune" size={30} color={BROWN_DARK} />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 items-center justify-center" onPress={() => router.push('/cart')}>
            <MaterialIcons name="shopping-cart" size={30} color={BROWN_DARK} />
          </TouchableOpacity>
          <View className="flex-1 mx-3 relative">
            <TextInput 
              value={search} 
              onChangeText={setSearch} 
              placeholder="ابحث" 
              placeholderTextColor={GRAY} 
              className="bg-white rounded-full py-2 px-10 border-2 border-brand-brown text-brand-brown text-sm font-medium"
              textAlign="right" 
            />
            <MaterialIcons name="search" size={20} color={GRAY} className="absolute left-3 top-1/2 -mt-2.5" />
          </View>
        </Animated.View>

        {/* Promo Banner (Carousel) */}
        <View className="mt-5 mb-5">
          <Carousel
            loop
            width={screenWidth}
            height={220}
            autoPlay
            autoPlayInterval={5000}
            data={promoSlides}
            scrollAnimationDuration={800}
            onSnapToItem={() => {}}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.9,
              parallaxScrollingOffset: 100,
            }}
            renderItem={({ item }) => (
              <View
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 4,
                  width: 300,
                  marginHorizontal: 26,
                }}
              >
                <Image
                  source={{uri: item.image}}
                  style={{ width: "100%", height: 220, resizeMode: "cover" }}
                />
                <Text style={{ position: "absolute", bottom: 10, left: 10, color: "#fff", fontWeight: "bold" }}>
                  {item.title}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Categories header */}
        <View className="mt-5 mb-3 items-end px-4">
          <Text className="text-lg font-extrabold text-brand-brown text-right">الاقسام</Text>
        </View>

        {/* Categories */}
        <Animated.View 
          className="mt-3"
          style={{ 
            opacity: appearSlow, 
            transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] 
          }}
        >
          {catLoading && cats.length === 0 ? (
            <Text className="text-center text-brand-brown">جاري تحميل الأقسام…</Text>
          ) : (
            <View className="relative">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-4"
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {(cats.length > 0 ? cats : categoryData).map((item: any, index: number) => {
                  const isLastItem = index === (cats.length > 0 ? cats : categoryData).length - 1;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      className={`mr-4 ${isLastItem ? 'mr-0' : ''}`}
                      activeOpacity={0.85}
                      onPress={() => {
                        router.push(`/category/${item.id}` as any);
                      }}
                    >
                      <View className="bg-brand-brown w-24 h-28 rounded-2xl items-center justify-center px-3 py-4 shadow-md">
                        {'image' in item && item.image ? (
                          <Image 
                            source={{ uri: (item as any).image }} 
                            className="w-10 h-10 mb-2"
                            style={{ borderRadius: 8 }}
                          />
                        ) : (
                          <FontAwesome6 
                            name={(item as any).iconName || 'book'} 
                            size={32} 
                            color={YELLOW} 
                            style={{ marginBottom: 8 }} 
                          />
                        )}
                        <Text className="text-xs text-brand-yellow text-center font-medium leading-4">
                          {(item as any).name_ar || (item as any).name || (item as any).title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {/* Scroll indicator - show partial next item */}
                <View className="w-6 h-28 items-center justify-center">
                  <View className="w-1 h-8 bg-gray-300 rounded-full opacity-50" />
                </View>
              </ScrollView>
            </View>
          )}
        </Animated.View>


        {/* Latest Products header */}
        <View className="mt-6 mb-3 items-end px-4">
          <Text className="text-lg font-extrabold text-brand-brown text-right">احدث المنتجات</Text>
        </View>

        {/* Products slider */}
        <Animated.View 
          className="mt-3"
          style={{ 
            opacity: appearSlow, 
            transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
          }}
        >
          {prodLoading && products.length === 0 ? (
            <Text className="text-center text-brand-brown">جاري تحميل المنتجات…</Text>
          ) : prodErr ? (
            <Text className="text-center text-red-600">{prodErr}</Text>
          ) : (
            <View className="relative">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-4"
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {products.map((p, index) => {
                  const imageUri = getProductImageUri(p);
                  const isLastItem = index === products.length - 1;
                  return (
                    <TouchableOpacity 
                      key={p.id} 
                      className={`mr-4 ${isLastItem ? 'mr-0' : ''}`}
                      onPress={() => {
                        console.log('🚀 Navigating to product:', p.id, 'Type:', typeof p.id);
                        router.push(`/product/${p.id}` as any);
                      }} 
                      activeOpacity={0.85}
                    >
                      <View className="bg-white w-40 h-56 rounded-2xl shadow-md overflow-hidden">
                        <Image 
                          source={{ uri: imageUri }} 
                          className="w-full h-40"
                          style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                          defaultSource={{ uri: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center&q=60' }}
                          onError={(error) => {
                            if (!imageUri.includes('via.placeholder.com')) {
                              console.warn(`Failed to load image for product ${p.id}: ${imageUri}`, error.nativeEvent?.error);
                            }
                          }}
                        />
                        <View className="p-3 flex-1 justify-between">
                          <Text className="text-sm font-semibold text-brand-brown text-right leading-5" numberOfLines={2}>
                            {p.name_ar || p.name || 'منتج'}
                          </Text>
                          <View className="flex-row items-center justify-between">
                            {p.base_price && (
                              <Text className="text-base font-bold text-brand-brown">
                                {p.base_price} ريال
                              </Text>
                            )}
                            <View className="bg-brand-brown px-3 py-1" style={{ borderRadius: 12 }}>
                              <Text className="text-xs font-bold text-brand-yellow">عرض</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {/* Scroll indicator - show partial next item */}
                <View className="w-6 h-56 items-center justify-center">
                  <View className="w-1 h-12 bg-gray-300 rounded-full opacity-50" />
                </View>
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Latest offers header */}
        <View className="mt-6 mb-3 items-end px-4">
          <Text className="text-lg font-extrabold text-brand-brown text-right">العروض</Text>
        </View>

        {/* Products grid */}
        <Animated.View 
          className="mt-3 flex-row flex-wrap justify-between px-4"
          style={{ 
            opacity: appearSlow, 
            transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] 
          }}
        >
          {prodLoading && products.length === 0 ? (
            <Text className="text-center text-brand-brown w-full">جاري تحميل المنتجات…</Text>
          ) : prodErr ? (
            <Text className="text-center text-red-600 w-full">{prodErr}</Text>
          ) : (
            products.map((p) => {
              const imageUri = getProductImageUri(p);
              return (
                <TouchableOpacity 
                  key={p.id} 
                  className="w-[48%] mb-4"
                  onPress={() => {
                    console.log('🚀 Navigating to product:', p.id, 'Type:', typeof p.id);
                    router.push(`/product/${p.id}` as any);
                  }} 
                  activeOpacity={0.85}
                >
                  <View className="bg-white rounded-xl overflow-hidden shadow-md">
                    <Image 
                      source={{ uri: imageUri }} 
                      className="w-full h-40"
                      style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                      defaultSource={{ uri: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center&q=60' }}
                      onError={(error) => {
                        if (!imageUri.includes('via.placeholder.com')) {
                          console.warn(`Failed to load image for product ${p.id}: ${imageUri}`, error.nativeEvent?.error);
                        }
                      }}
                    />
                    <View className="p-3">
                      <Text className="text-sm font-semibold text-brand-brown text-right mb-2 leading-5" numberOfLines={2}>
                        {p.name_ar || p.name || 'منتج'}
                      </Text>
                      {p.base_price && (
                        <Text className="text-base font-bold text-brand-brown mb-2">
                          {p.base_price} ريال
                        </Text>
                      )}
                      <View className="bg-brand-brown px-4 py-2 self-center" style={{ borderRadius: 8 }}>
                        <Text className="text-xs font-bold text-brand-yellow">عرض</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  userInfoCard: {
    backgroundColor: YELLOW,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: YELLOW_DARK,
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  userDetails: {
    flex: 1,
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 16,
    color: BRAND_BLUE,
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'left',
  },
  userType: {
    fontSize: 12,
    color: BRAND_BLUE,
    fontFamily: 'NotoSansArabic_500Medium',
    marginTop: 2,
    textAlign: 'left',
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BROWN_DARK,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
    gap: 5,
  },
  controlButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    marginHorizontal: 12,
    position: 'relative',
  },
  headerSearchInput: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: BROWN_DARK,
    color: BROWN_DARK,
    fontSize: 14,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  headerSearchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -10,
  },


  categoriesGrid: {
    marginTop: 20,
    paddingHorizontal: 0,
  },
  categoriesScrollView: {
    marginTop: 12,
  },
  categoryItem: {
    marginRight: 16,
  },
  categoryCard: {
    backgroundColor: BROWN_DARK,
    width: 100,
    height: 120,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  categoryLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: YELLOW,
    lineHeight: 16,
    fontFamily: 'NotoSansArabic_500Medium',
    marginTop: 4,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  carouselContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  categoriesHeader: {
    marginTop: 20,
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  categoriesTitle: {
    fontSize: 14,
    color: BROWN_DARK,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    textAlign: 'right',
  },
  promoCard: {
    marginTop: 15,
    backgroundColor: YELLOW,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  promoImageWrap: {
    width: '30%',
  },
  promoImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  promoTextWrap: {
    width: '60%',
    paddingStart: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: BROWN_DARK,
    textAlign: 'right',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 13,
    fontFamily: 'NotoSansArabic_500Medium',
    color: BROWN_DARK,
    textAlign: 'right',
    marginBottom: 8,
  },
  discountBadge: {
    backgroundColor: BROWN_DARK,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'flex-end',
  },
  discountText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: YELLOW,
    fontSize: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    gap: 8,
    alignItems: 'center',
  },
  dash: {
    borderRadius: 3,
    backgroundColor: BROWN_DARK,
    color: YELLOW,
  },
  offersHeader: {
    marginTop: 20,
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  offersTitle: {
    fontSize: 14,
    color: BROWN_DARK,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    textAlign: 'right',
  },
  productsGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  productCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    borderRadius: 12,
    height: 160,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 12,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 80,
  },
  productTitle: {
    fontSize: 14,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: BROWN_DARK,
    textAlign: 'right',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_700Bold',
    color: BROWN_DARK,
    textAlign: 'right',
    marginBottom: 8,
  },
  productBtn: {
    backgroundColor: BROWN_DARK,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  productBtnText: {
    color: YELLOW,
    fontSize: 12,
    fontFamily: 'NotoSansArabic_700Bold',
  },
});
