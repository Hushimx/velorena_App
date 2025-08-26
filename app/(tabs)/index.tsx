import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  I18nManager,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore, useIsAuthenticated, useUser } from '../../store/useAuthStore';
import { getCategories, getProducts, logoutUser } from '../../utils/api';

const YELLOW = '#ffde9f';
const YELLOW_DARK = '#f5d182';
const BROWN_DARK = '#2a1e1e';
const TEXT_DARK = '#2a1e1e';
const GRAY = '#9CA3AF';
const BRAND_BLUE = '#2a1e1e';

const categoryData = [
  {
    id: 'catalog',
    title: 'كتالوج',
    iconName: 'book-open',
  },
  {
    id: 'notebook',
    title: 'كشكول',
    iconName: 'book',
  },
  {
    id: 'cards',
    title: 'الكروت\nالشخصية',
    iconName: 'id-card',
  },
  {
    id: 'spiral',
    title: 'كشكول\nبسلك',
    iconName: 'book-open-reader',
  },
] as const;

const productData = [
  {
    id: 'p1',
    title: 'كتالوج الإضاءة 2025',
    image: 'https://images.unsplash.com/photo-1678930427302-381e63fbe826?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    price: 120,
    rating: 4.5,
    ratingCount: 2553,
    description: 'اكتشف مجموعتنا الحصرية من وحدات الإضاءة التي تجمع بين التصميم العصري والأناقة الراقية. هذا الكتالوج يقدم لك تشكيلة متنوعة من المصابيح والإضاءة المتطورة.'
  },
  {
    id: 'p2',
    title: 'كشكول متعدد الأغراض',
    image: 'https://images.unsplash.com/photo-1613187433272-9d21d5c9b8e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fHByb2R1Y3RzfGVufDB8MnwwfHx8MA%3D%3D',
    price: 85,
    rating: 4.2,
    ratingCount: 1420,
    description: 'كشكول عملي ومتين مناسب لجميع الاستخدامات اليومية. يحتوي على أوراق عالية الجودة ومقاوم للتلف مع تصميم أنيق وعملي.'
  },
  {
    id: 'p3',
    title: 'دفتر ملاحظات أسود',
    image: 'https://images.unsplash.com/photo-1680063122329-69ef93b72c53?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fHByb2R1Y3RzfGVufDB8MnwwfHx8MA%3D%3D',
    price: 95,
    rating: 4.7,
    ratingCount: 890,
    description: 'دفتر ملاحظات أنيق باللون الأسود مع تصميم كلاسيكي. مثالي للاستخدام المهني والشخصي مع أوراق ناعمة وغلاف متين.'
  },
  {
    id: 'p4',
    title: 'مجموعة دفاتر ملونة',
    image: 'https://images.unsplash.com/photo-1601612577732-b1d029952170?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjN8fHByb2R1Y3RzfGVufDB8MnwwfHx8MA%3D%3D',
    price: 150,
    rating: 4.3,
    ratingCount: 2100,
    description: 'مجموعة من الدفاتر الملونة المتنوعة مناسبة للطلاب والمهنيين. تتضمن ألوان زاهية وتصاميم جذابة مع جودة عالية في الطباعة.'
  }
];
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
];

export default function HomeScreen() {
  const appear = useRef(new Animated.Value(0)).current;
  const appearSlow = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const [bannerWidth, setBannerWidth] = useState(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [cats, setCats] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catErr, setCatErr] = useState<string | null>(null);
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

  const isRTL = useMemo(() => I18nManager.isRTL ?? true, []);

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
        setCatErr(null);
      } catch (e: any) {
        setCatErr(e?.message || 'فشل تحميل الأقسام');
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
          <Animated.View style={[styles.userInfoCard, { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
            <View style={styles.userInfoContent}>
              <View style={styles.userDetails}>
                <Text style={styles.welcomeText}>مرحباً، {user.full_name}</Text>
                <Text style={styles.userType}>
                  {user.client_type === 'individual' ? 'حساب فردي' : 'حساب شركة'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={16} color={YELLOW} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Header Controls */}
        <Animated.View style={[styles.headerControls, { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="tune" size={30} color={BROWN_DARK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton}>
            <MaterialIcons name="shopping-cart" size={30} color={BROWN_DARK} />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput value={search} onChangeText={setSearch} placeholder="ابحث" placeholderTextColor={GRAY} style={styles.headerSearchInput} textAlign="right" />
            <MaterialIcons name="search" size={20} color={GRAY} style={styles.headerSearchIcon} />
          </View>
        </Animated.View>


        {/* Categories header */}
        <View style={styles.categoriesHeader}> 
          <Text style={styles.categoriesTitle}>الاقسام</Text>
        </View>

        {/* Categories */}
        <Animated.View style={[styles.categoriesGrid, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          {catLoading && cats.length === 0 ? (
            <Text style={{ textAlign: 'center', color: BRAND_BLUE }}>جاري تحميل الأقسام…</Text>
          ) : catErr ? (
            <Text style={{ textAlign: 'center', color: '#b91c1c' }}>{catErr}</Text>
          ) : (
            cats.map((item) => (
              <TouchableOpacity key={item.id} style={styles.categoryItem} activeOpacity={0.85} onPress={() => router.push(`/category/${item.id}` as any)}>
                <View style={styles.categoryCard}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: 32, height: 32, borderRadius: 8 }} />
                  ) : (
                    <FontAwesome6 name="book" size={24} color={YELLOW} />
                  )}
                  <Text style={styles.categoryLabel}>{item.name_ar || item.name}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        {/* Promo Banner (Carousel) */}
        <View onLayout={(e) => setBannerWidth(e.nativeEvent.layout.width)}>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            snapToInterval={bannerWidth > 40 ? bannerWidth - 40 : 100}
            decelerationRate="fast"
          >
            {promoSlides.map((slide) => (
              <View key={slide.id} style={[styles.promoCard, { width: bannerWidth > 40 ? bannerWidth - 40 : 100, backgroundColor: slide.bg, marginHorizontal: 10 }]}> 
                <View style={styles.promoImageWrap}>
                  <Image source={{ uri: slide.image }} style={styles.promoImage} />
                </View>
                <View style={styles.promoTextWrap}>
                  <Text style={styles.promoTitle}>{slide.title}</Text>
                  <Text style={styles.promoSubtitle}>{slide.subtitle}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{slide.discount}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Animated.ScrollView>
          <View style={styles.dotsRow}>
            {promoSlides.map((_, i) => {
              // Only animate when bannerWidth is properly initialized
              if (bannerWidth <= 40) {
                return (
                  <View 
                    key={`dash-${i}`} 
                    style={[
                      styles.dash, 
                      { 
                        backgroundColor: BROWN_DARK, 
                        width: 20,
                        height: 3,
                      }
                    ]} 
                  />
                );
              }

              const snapInterval = bannerWidth - 40;
              const inputRange = [
                Math.max(0, (i - 1) * snapInterval),
                i * snapInterval,
                (i + 1) * snapInterval,
              ];
              
              // Ensure first dash is active by default (when scrollX is 0)
              const opacity = scrollX.interpolate({ 
                inputRange, 
                outputRange: i === 0 ? [1, 1, 0.4] : [0.4, 1, 0.4], 
                extrapolate: 'clamp' 
              });
              const width = scrollX.interpolate({ 
                inputRange, 
                outputRange: i === 0 ? [48, 48, 16] : [16, 48, 16], 
                extrapolate: 'clamp' 
              });
              const height = scrollX.interpolate({ 
                inputRange, 
                outputRange: i === 0 ? [7, 7, 3] : [3, 7, 3], 
                extrapolate: 'clamp' 
              });
              return (
                <Animated.View 
                  key={`dash-${i}`} 
                  style={[
                    styles.dash, 
                    { 
                      backgroundColor: BROWN_DARK, 
                      opacity, 
                      width,
                      height,
                    }
                  ]} 
                />
              );
            })}
          </View>
        </View>

        {/* Latest offers header */}
        <View style={styles.offersHeader}> 
          <Text style={styles.offersTitle}>العروض</Text>
        </View>

        {/* Products grid */}
        <Animated.View style={[styles.productsGrid, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {prodLoading && products.length === 0 ? (
            <Text style={{ textAlign: 'center', color: BRAND_BLUE }}>جاري تحميل المنتجات…</Text>
          ) : prodErr ? (
            <Text style={{ textAlign: 'center', color: '#b91c1c' }}>{prodErr}</Text>
          ) : (
            products.map((p) => (
              <TouchableOpacity key={p.id} style={styles.productCard} onPress={() => router.push(`/product/${p.id}` as any)} activeOpacity={0.85}>
                <Image source={{ uri: p.image || 'https://via.placeholder.com/400x300' }} style={styles.productImage} />
                <View style={styles.productFooter}>
                  <View style={styles.productBtn}>
                    <Text style={styles.productBtnText}>عرض</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryCard: {
    backgroundColor: BROWN_DARK,
    width: 75,
    height: 80,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  categoryLabel: {
    textAlign: 'center',
    fontSize: 11,
    color: YELLOW,
    lineHeight: 14,
    fontFamily: 'NotoSansArabic_500Medium',
    marginTop: 4,
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
    marginTop: 20,
    backgroundColor: YELLOW,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  promoImageWrap: {
    width: '35%',
  },
  promoImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  promoTextWrap: {
    width: '65%',
    paddingStart: 16,
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
  productFooter: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
