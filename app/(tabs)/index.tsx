import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import ProductCard from '../../components/ProductCard';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { SectionError } from '../../components/ErrorState';
import { 
  BannerSkeleton, 
  CategoriesSkeleton, 
  ProductsGridSkeleton, 
  HorizontalProductsSkeleton 
} from '../../components/Skeleton';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { getCategories, getProducts, getImageUrl, getHomeBanners } from '../../utils/api';
import { useSkeletonLoading } from '../../hooks/useSkeletonLoading';

// Colors are now imported from Theme.ts

const { width: screenWidth } = Dimensions.get('window');

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
  const router = useRouter();
  

  const [cats, setCats] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [prodErr, setProdErr] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  
  // New state for latest products and best sellers
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestError, setLatestError] = useState<string | null>(null);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [bestSellersLoading, setBestSellersLoading] = useState(true);
  const [bestSellersError, setBestSellersError] = useState<string | null>(null);
  
  // State for banners
  const [banners, setBanners] = useState<any[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannersError, setBannersError] = useState<string | null>(null);

  // Skeleton loading with minimum display time
  const showBannersSkeleton = useSkeletonLoading({ 
    isLoading: bannersLoading && banners.length === 0, 
    minimumDisplayTime: 1000 
  });
  const showCategoriesSkeleton = useSkeletonLoading({ 
    isLoading: catLoading && cats.length === 0, 
    minimumDisplayTime: 1200 
  });
  const showProductsSkeleton = useSkeletonLoading({ 
    isLoading: prodLoading && products.length === 0, 
    minimumDisplayTime: 1500 
  });
  const showLatestSkeleton = useSkeletonLoading({ 
    isLoading: latestLoading && latestProducts.length === 0, 
    minimumDisplayTime: 1800 
  });
  const showBestSellersSkeleton = useSkeletonLoading({ 
    isLoading: bestSellersLoading && bestSellers.length === 0, 
    minimumDisplayTime: 2000 
  });

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
        setCatError(null);
        const catRes = await getCategories({ page: 1, limit: 8 }, ac.signal);
        setCats(catRes?.data?.data ?? []);
      } catch (e: any) {
        console.warn('Failed to load categories:', e?.message);
        setCatError(e?.message || 'فشل في تحميل الأقسام');
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
      
      // Fetch banners
      try {
        setBannersLoading(true);
        setBannersError(null);
        const bannersRes = await getHomeBanners(ac.signal);
        setBanners(bannersRes?.data ?? []);
      } catch (e: any) {
        console.warn('Failed to load banners:', e?.message);
        setBannersError(e?.message || 'فشل في تحميل البنرات');
        setBanners([]);
      } finally {
        setBannersLoading(false);
      }
      
      // Fetch latest products (using existing products data for now)
      try {
        setLatestLoading(true);
        setLatestError(null);
        const latestRes = await getProducts({ page: 1, limit: 10 }, ac.signal);
        setLatestProducts(latestRes?.data?.data ?? []);
      } catch (e: any) {
        console.warn('Failed to load latest products:', e?.message);
        setLatestError(e?.message || 'فشل في تحميل أحدث المنتجات');
        setLatestProducts([]);
      } finally {
        setLatestLoading(false);
      }
      
      // Fetch best sellers (using existing products data for now)
      try {
        setBestSellersLoading(true);
        setBestSellersError(null);
        const bestSellersRes = await getProducts({ page: 2, limit: 10 }, ac.signal);
        setBestSellers(bestSellersRes?.data?.data ?? []);
      } catch (e: any) {
        console.warn('Failed to load best sellers:', e?.message);
        setBestSellersError(e?.message || 'فشل في تحميل الأكثر مبيعاً');
        setBestSellers([]);
      } finally {
        setBestSellersLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  return (
    <SafeAreaWrapper backgroundColor={BRAND_COLORS.background.primary}>
      <ScrollView
        contentContainerStyle={styles.container}
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
          {showBannersSkeleton ? (
            <BannerSkeleton />
          ) : bannersError ? (
            <SectionError message={bannersError} onRetry={() => {
              setBannersError(null);
              setBannersLoading(true);
            }} />
          ) : banners.length > 0 ? (
            <Carousel
              loop
              width={screenWidth}
              height={180}
              autoPlay
              autoPlayInterval={4000}
              data={banners}
              scrollAnimationDuration={1200}
              onSnapToItem={() => {}}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.98,
                parallaxScrollingOffset: 37,
              }}
              withAnimation={{
                type: 'spring',
                config: {
                  damping: 20,
                  stiffness: 150,
                  mass: 1,
                },
              }}
              renderItem={({ item }) => {
                const imageUrl = getImageUrl(item.image);
                return (
                  <View
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: "#fff",
                      shadowColor: "#000",
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 5,
                      width: screenWidth - 32,
                      marginHorizontal: 16,
                    }}
                  >
                    <Image
                      source={imageUrl 
                          ? { uri: imageUrl } 
                          : require('../../assets/images/catagory-placeholer.png')
                      }
                      style={{ width: "100%", height: 180, resizeMode: "cover" }}
                    />
                  </View>
                );
              }}
            />
          ) : (
            <Carousel
              loop
              width={screenWidth}
              height={180}
              autoPlay
              autoPlayInterval={4000}
              data={promoSlides}
              scrollAnimationDuration={1200}
              onSnapToItem={() => {}}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.98,
                parallaxScrollingOffset: 40,
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
                    borderRadius: 12,
                    overflow: "hidden",
                    backgroundColor: "#fff",
                    shadowColor: "#000",
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 5,
                    width: screenWidth - 32,
                    marginHorizontal: 16,
                  }}
                >
                  <Image
                    source={(item.image && typeof item.image === 'string' && item.image.trim()) 
                        ? { uri: item.image } 
                        : require('../../assets/images/catagory-placeholer.png')
                    }
                    style={{ width: "100%", height: 180, resizeMode: "cover" }}
                  />
                </View>
              )}
            />
          )}
        </View>

        {/* Categories header */}
        <View style={styles.categoriesHeader}> 
          <Text style={styles.categoriesTitle}>الاقسام</Text>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          {showCategoriesSkeleton ? (
            <CategoriesSkeleton />
          ) : catError ? (
            <SectionError message={catError} onRetry={() => {
              setCatError(null);
              setCatLoading(true);
            }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {(cats.length > 0 ? cats : []).filter((item: any) => {
                // Only show categories that have slider_image
                if (!item.slider_image || item.slider_image.trim() === '') {
                  return false;
                }
                const imageUrl = getImageUrl(item.slider_image);
                return imageUrl && imageUrl.trim() !== '' && imageUrl !== 'undefined'; // Only include categories with valid, non-empty image URLs
              }).map((item: any) => {
                const isActive = activeCategoryId === item.id;
                // Get image URL - prioritize slider_image, fallback to main_image, then image
                const getImageSource = () => {
                  const imageUrl = getImageUrl(item.slider_image);
                  if (imageUrl && imageUrl.trim() !== '') {
                    return { uri: imageUrl };
                  }
                  // Return placeholder image if no valid URL
                  return require('../../assets/images/catagory-placeholer.png');
                };
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.categoryCard, isActive && styles.activeCategoryCard]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setActiveCategoryId(item.id);
                      router.push(`/category/${item.id}` as any);
                    }}
                  >
                    <View style={styles.categoryImageContainer}>
                      <Image 
                        source={getImageSource()} 
                        style={styles.categoryImage} 
                        resizeMode="cover"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Latest offers header */}
        <View style={styles.offersHeader}> 
          <Text style={styles.offersTitle}>العروض</Text>
        </View>

        {/* Products grid */}
        <Animated.View style={[styles.productsGrid, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {showProductsSkeleton ? (
            <ProductsGridSkeleton count={6} />
          ) : prodErr ? (
            <SectionError message={prodErr} onRetry={() => {
              setProdErr(null);
              setProdLoading(true);
              // Retry logic would go here
            }} />
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
          {showLatestSkeleton ? (
            <HorizontalProductsSkeleton count={5} />
          ) : latestError ? (
            <SectionError message={latestError} onRetry={() => {
              setLatestError(null);
              setLatestLoading(true);
              // Retry logic would go here
            }} />
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
          {showBestSellersSkeleton ? (
            <HorizontalProductsSkeleton count={5} />
          ) : bestSellersError ? (
            <SectionError message={bestSellersError} onRetry={() => {
              setBestSellersError(null);
              setBestSellersLoading(true);
              // Retry logic would go here
            }} />
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
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  container: {
    paddingBottom: SPACING['2xl'],
    paddingTop: Platform.OS === 'ios' ? 0 : 12,
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
  },
  userType: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginTop: 2,
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


  categoriesSection: {
    marginTop: SPACING.lg,
  },
  categoriesContainer: {
    paddingHorizontal: SPACING.sm,
    gap: SPACING.md,
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeCategoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: BRAND_COLORS.primary,
    borderWidth: 2,
  },
  categoryImageContainer: {
    width: 72,
    height: 106,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    lineHeight: 16,
  },
  activeCategoryText: {
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  carouselContainer: {
    marginTop: SPACING.xl,
  },
  categoriesHeader: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  categoriesTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.extraBold,
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
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.extraBold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    marginBottom: 8,
  },
  discountBadge: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
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
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  offersTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.extraBold,
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
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.extraBold,
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
});
