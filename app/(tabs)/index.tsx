import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '../../components/ProductCard';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { getCategories, getProducts } from '../../utils/api';

// Colors are now imported from Theme.ts

const { width: screenWidth } = Dimensions.get('window');


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
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const catScrollRef = useRef<ScrollView | null>(null);
  
  // New state for latest products and best sellers
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [bestSellersLoading, setBestSellersLoading] = useState(true);

  // Auth store usage (currently unused after removing user info section)
  // const user = useUser();
  // const isAuthenticated = useIsAuthenticated();
  // const { logout } = useAuthStore();

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



  // Logout handler (currently unused after removing user info section)
  // const handleLogout = async () => {
  //   Alert.alert(
  //     'تسجيل الخروج',
  //     'هل أنت متأكد من تسجيل الخروج؟',
  //     [
  //       {
  //         text: 'إلغاء',
  //         style: 'cancel'
  //       },
  //       {
  //         text: 'تسجيل الخروج',
  //         style: 'destructive',
  //         onPress: async () => {
  //           try {
  //             await logoutUser(); // Call backend logout if needed
  //           } catch (error) {
  //             console.warn('Logout API call failed:', error);
  //           } finally {
  //             logout(); // Clear local storage
  //             router.replace('/login');
  //           }
  //         }
  //       }
  //     ]
  //   );
  // };

  // Authentication is now handled at the app level by AuthProvider

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setCatLoading(true);
        const catRes = await getCategories({ page: 1, limit: 8 }, ac.signal);
        setCats(catRes?.data?.data ?? []);
      } catch (e: any) {
        console.warn('Failed to load categories:', e?.message);
      } finally {
        setCatLoading(false);
      }
      try {
        setProdLoading(true);
        const prodRes = await getProducts({ page: 1, limit: 8 }, ac.signal);
        setProducts(prodRes?.data?.data ?? []);
        setProdErr(null);
      } catch (e: any) {
        setProdErr(e?.message || 'فشل تحميل المنتجات');
      } finally {
        setProdLoading(false);
      }
      
      // Fetch latest products (using existing products data for now)
      try {
        setLatestLoading(true);
        const latestRes = await getProducts({ page: 1, limit: 10 }, ac.signal);
        setLatestProducts(latestRes?.data?.data ?? []);
      } catch (e: any) {
        console.warn('Failed to load latest products:', e?.message);
        setLatestProducts([]);
      } finally {
        setLatestLoading(false);
      }
      
      // Fetch best sellers (using existing products data for now)
      try {
        setBestSellersLoading(true);
        const bestSellersRes = await getProducts({ page: 2, limit: 10 }, ac.signal);
        setBestSellers(bestSellersRes?.data?.data ?? []);
      } catch (e: any) {
        console.warn('Failed to load best sellers:', e?.message);
        setBestSellers([]);
      } finally {
        setBestSellersLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* Header Controls */}
        <Animated.View style={[styles.headerControls, { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <TouchableOpacity 
            style={styles.searchContainer}
            onPress={() => router.push('/search?focus=true')}
            activeOpacity={0.9}
          >
            <View style={styles.searchInputWrapper}>
              <Text style={styles.searchPlaceholder}>ابحث عن المنتجات...</Text>
              <View style={styles.searchIconContainer}>
                <MaterialIcons name="search" size={20} color={BRAND_COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="tune" size={30} color={BRAND_COLORS.text.primary} />
          </TouchableOpacity>

        </Animated.View>

        {/* Promo Banner (Carousel) */}
        <View style={styles.carouselContainer}>
          <Carousel
            loop
            width={screenWidth}
            height={220}
            autoPlay
            autoPlayInterval={4000}
            data={promoSlides}
            scrollAnimationDuration={1200}
            onSnapToItem={() => {}}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.95,
              parallaxScrollingOffset: 80,
            }}
            withAnimation={{
              type: 'spring',
              config: {
                damping: 20,
                stiffness: 150,
                mass: 1,
              },
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
                  marginHorizontal: 36,
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
        <View style={styles.categoriesHeader}> 
          <Text style={styles.categoriesTitle}>الاقسام</Text>
        </View>

        {/* Categories */}
        <Animated.View style={[styles.categoriesGrid, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          {catLoading && cats.length === 0 ? (
            <Text style={{ textAlign: 'center', color: BRAND_COLORS.text.primary }}>جاري تحميل الأقسام…</Text>
          ) : (
            <View style={styles.categoriesRow}>
              <TouchableOpacity
                style={styles.categoriesArrow}
                activeOpacity={0.7}
                onPress={() => catScrollRef.current?.scrollTo({ x: Math.max(0, (Number((catScrollRef as any)?.current?._lastX) || 0) - 140), animated: true })}
              >
                <MaterialIcons name="chevron-left" size={20} color={BRAND_COLORS.text.primary} />
              </TouchableOpacity>
              <ScrollView
                ref={catScrollRef as any}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScrollContent}
                onScroll={(e) => { (catScrollRef as any).current._lastX = e.nativeEvent.contentOffset.x; }}
                scrollEventThrottle={16}
              >
                {(cats.length > 0 ? cats : categoryData).map((item: any) => {
                  const isActive = activeCategoryId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.categoryItem}
                      activeOpacity={0.85}
                      onPress={() => {
                        setActiveCategoryId(item.id);
                        router.push(`/category/${item.id}` as any);
                      }}
                    >
                <View style={styles.categoryCard}>
                        {'image' in item && item.image ? (
                          <Image source={{ uri: (item as any).image }} style={{ width: 36, height: 36, borderRadius: 8, opacity: isActive ? 1 : 0.6 }} />
                  ) : (
                          <FontAwesome6 name={(item as any).iconName || 'book'} size={28} color={isActive ? BRAND_COLORS.text.primary : BRAND_COLORS.text.tertiary} />
                  )}
                        <Text style={[styles.categoryLabel, { color: isActive ? BRAND_COLORS.text.primary : BRAND_COLORS.text.tertiary }]}>
                          {(item as any).name_ar || (item as any).name || (item as any).title}
                        </Text>
                        <View style={[styles.categoryUnderline, { backgroundColor: isActive ? BRAND_COLORS.text.primary : 'transparent' }]} />
                </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={styles.categoriesArrow}
                activeOpacity={0.7}
                onPress={() => catScrollRef.current?.scrollTo({ x: ((catScrollRef as any)?.current?._lastX || 0) + 140, animated: true })}
              >
                <MaterialIcons name="chevron-right" size={20} color={BRAND_COLORS.text.primary} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>


        {/* Latest offers header */}
        <View style={styles.offersHeader}> 
          <Text style={styles.offersTitle}>العروض</Text>
        </View>

        {/* Products grid */}
        <Animated.View style={[styles.productsGrid, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {prodLoading && products.length === 0 ? (
            <Text style={{ textAlign: 'center', color: BRAND_COLORS.text.primary }}>جاري تحميل المنتجات…</Text>
          ) : prodErr ? (
            <Text style={{ textAlign: 'center', color: BRAND_COLORS.error }}>{prodErr}</Text>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
              />
            ))
          )}
        </Animated.View>

        {/* Latest Products Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>احدث المنتجات</Text>
        </View>

        <Animated.View style={[styles.horizontalProductsContainer, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {latestLoading && latestProducts.length === 0 ? (
            <Text style={styles.loadingText}>جاري تحميل أحدث المنتجات…</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              style={styles.horizontalScroll}
            >
              {latestProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="horizontal"
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Best Sellers Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>الاكثر مبيعاً</Text>
        </View>

        <Animated.View style={[styles.horizontalProductsContainer, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {bestSellersLoading && bestSellers.length === 0 ? (
            <Text style={styles.loadingText}>جاري تحميل الأكثر مبيعاً…</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              style={styles.horizontalScroll}
            >
              {bestSellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="horizontal"
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  container: {
    paddingBottom: SPACING['2xl'],
    direction: 'rtl',
  },
  userInfoCard: {
    backgroundColor: BRAND_COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: BRAND_COLORS.accent,
  },
  userInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
  },
  userDetails: {
    flex: 1,
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'left',
  },
  userType: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginTop: 2,
    textAlign: 'left',
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
    gap: SPACING.xs,
  },
  controlButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    borderRadius: 25,
    backgroundColor: BRAND_COLORS.background.primary,
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
  },
  searchPlaceholder: {
    flex: 1,
    color: BRAND_COLORS.text.tertiary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'left',
    paddingLeft: 35,
  },
  searchIconContainer: {
    position: 'absolute',
    left: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${BRAND_COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },


  categoriesGrid: {
    marginTop: SPACING.xl,
    paddingHorizontal: 0,
  },
  categoryItem: {
    alignItems: 'center',
    marginBottom: 0,
    marginHorizontal: SPACING.sm,
  },
  categoryCard: {
    backgroundColor: 'transparent',
    width: 90,
    height: 88,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  categoryLabel: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: BRAND_COLORS.text.primary,
    lineHeight: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginTop: SPACING.xs,
  },
  categoriesScrollContent: {
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoriesArrow: {
    width: 28,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryUnderline: {
    width: 44,
    height: 3,
    borderRadius: 2,
    marginTop: 0,
    transform: [{ translateY: 12 }],
  },
  carouselContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  categoriesHeader: {
    marginTop: SPACING.xl,
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  categoriesTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.extraBold,
    textAlign: 'right',
  },
  promoCard: {
    marginTop: 15,
    backgroundColor: BRAND_COLORS.secondary,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.lg,
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
    fontFamily: TYPOGRAPHY.fontFamily.extraBold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
    marginBottom: 8,
  },
  discountBadge: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    alignSelf: 'flex-end',
  },
  discountText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.secondary,
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
    backgroundColor: BRAND_COLORS.primary,
    color: BRAND_COLORS.secondary,
  },
  offersHeader: {
    marginTop: SPACING.xl,
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  offersTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.extraBold,
    textAlign: 'right',
  },
  productsGrid: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  sectionHeader: {
    marginTop: SPACING.xl,
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.extraBold,
    textAlign: 'right',
  },
  horizontalProductsContainer: {
    marginTop: SPACING.sm,
    paddingHorizontal: 0,
  },
  horizontalScroll: {
    flex: 1,
  },
  horizontalScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  loadingText: {
    textAlign: 'center',
    color: BRAND_COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    paddingVertical: SPACING.lg,
  },
});
