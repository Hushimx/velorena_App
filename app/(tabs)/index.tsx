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
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const catScrollRef = useRef<ScrollView | null>(null);
  const promoScrollRef = useRef<ScrollView | null>(null);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

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

  // Auto-scroll promo carousel with enhanced smooth animations
  useEffect(() => {
    // Only start auto-scroll when bannerWidth is properly initialized
    if (bannerWidth <= 40) return;
    
    const autoScrollInterval = setInterval(() => {
      if (promoScrollRef.current && bannerWidth > 40) {
        const nextIndex = (currentPromoIndex + 1) % promoSlides.length;
        const snapInterval = bannerWidth;
        const nextScrollX = nextIndex * snapInterval;
        
        // Enhanced smooth scrolling with custom timing and proper centering
        promoScrollRef.current.scrollTo({
          x: nextScrollX,
          animated: true
        });
        
        // Update index after a small delay to ensure smooth transition
        setTimeout(() => {
          setCurrentPromoIndex(nextIndex);
        }, 300);
      }
    }, 5000); // Increased to 5 seconds for better viewing experience

    return () => clearInterval(autoScrollInterval);
  }, [currentPromoIndex, bannerWidth]);

  // Ensure first banner is properly positioned when component loads
  useEffect(() => {
    if (bannerWidth > 40 && promoScrollRef.current) {
      // Set initial scroll position to center the first banner
      promoScrollRef.current.scrollTo({
        x: 0,
        animated: false
      });
      setCurrentPromoIndex(0);
    }
  }, [bannerWidth]);

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
          <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')}>
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
          ) : (
            <View style={styles.categoriesRow}>
              <TouchableOpacity
                style={styles.categoriesArrow}
                activeOpacity={0.7}
                onPress={() => catScrollRef.current?.scrollTo({ x: Math.max(0, (Number((catScrollRef as any)?.current?._lastX) || 0) - 140), animated: true })}
              >
                <MaterialIcons name="chevron-left" size={20} color={BROWN_DARK} />
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
                          <FontAwesome6 name={(item as any).iconName || 'book'} size={28} color={isActive ? BROWN_DARK : '#9CA3AF'} />
                  )}
                        <Text style={[styles.categoryLabel, { color: isActive ? BROWN_DARK : '#9CA3AF' }]}>
                          {(item as any).name_ar || (item as any).name || (item as any).title}
                        </Text>
                        <View style={[styles.categoryUnderline, { backgroundColor: isActive ? BROWN_DARK : 'transparent' }]} />
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
                <MaterialIcons name="chevron-right" size={20} color={BROWN_DARK} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Promo Banner (Carousel) */}
        <View 
          onLayout={(e) => setBannerWidth(e.nativeEvent.layout.width)}
          style={{ alignItems: 'center', overflow: 'hidden', justifyContent: 'center' }}
        >
          <Animated.ScrollView
            ref={promoScrollRef}
            horizontal
            pagingEnabled
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(e) => {
              const snapInterval = bannerWidth * 0.85;
              const currentIndex = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
              setCurrentPromoIndex(currentIndex);
              
              // Ensure the banner is perfectly positioned
              if (promoScrollRef.current) {
                const targetScrollX = currentIndex * snapInterval;
                promoScrollRef.current.scrollTo({
                  x: targetScrollX,
                  animated: true
                });
              }
            }}
            contentContainerStyle={{ 
              paddingHorizontal: 0,
              width: bannerWidth > 40 ? bannerWidth * promoSlides.length : '100%',
              flexDirection: 'row',
              justifyContent: 'flex-start'
            }}
            snapToInterval={bannerWidth > 40 ? bannerWidth : 100}
            decelerationRate={0.9}
            snapToAlignment="start"
            bounces={false}
            overScrollMode="never"
            style={{ width: bannerWidth > 40 ? bannerWidth : '100%' }}
            scrollEventThrottle={8}
            showsHorizontalScrollIndicator={false}
          >
            {promoSlides.map((slide, index) => (
              <Animated.View 
                key={slide.id} 
                                  style={[
                    styles.promoCard, 
                                      { 
                    width: bannerWidth > 40 ? bannerWidth * 0.85 : 100, 
                    backgroundColor: slide.bg, 
                    marginHorizontal: (bannerWidth > 40 ? bannerWidth * 0.075 : 10),
                    alignSelf: 'center',
                      opacity: bannerWidth > 40 ? scrollX.interpolate({
                        inputRange: [
                          index === 0 ? 0 : (index - 1) * bannerWidth,
                          index * bannerWidth,
                          index === promoSlides.length - 1 ? index * bannerWidth : (index + 1) * bannerWidth,
                        ],
                        outputRange: index === 0 ? [1, 1, 0.3] : index === promoSlides.length - 1 ? [0.3, 1, 1] : [0.3, 1, 0.3],
                        extrapolate: 'clamp',
                      }) : 1,
                      transform: [{
                        scale: bannerWidth > 40 ? scrollX.interpolate({
                          inputRange: [
                            index === 0 ? 0 : (index - 1) * bannerWidth,
                            index * bannerWidth,
                            index === promoSlides.length - 1 ? index * bannerWidth : (index + 1) * bannerWidth,
                          ],
                          outputRange: index === 0 ? [1.05, 1.05, 0.85] : index === promoSlides.length - 1 ? [0.85, 1.05, 1.05] : [0.85, 1.05, 0.85],
                          extrapolate: 'clamp',
                        }) : 1,
                      }, {
                        translateY: bannerWidth > 40 ? scrollX.interpolate({
                          inputRange: [
                            index === 0 ? 0 : (index - 1) * bannerWidth,
                            index * bannerWidth,
                            index === promoSlides.length - 1 ? index * bannerWidth : (index + 1) * bannerWidth,
                          ],
                          outputRange: index === 0 ? [-8, -8, 0] : index === promoSlides.length - 1 ? [0, -8, -8] : [0, -8, 0],
                          extrapolate: 'clamp',
                        }) : 0,
                      }],
                      shadowOpacity: bannerWidth > 40 ? scrollX.interpolate({
                        inputRange: [
                          index === 0 ? 0 : (index - 1) * bannerWidth,
                          index * bannerWidth,
                          index === promoSlides.length - 1 ? index * bannerWidth : (index + 1) * bannerWidth,
                        ],
                        outputRange: index === 0 ? [0.3, 0.3, 0.1] : index === promoSlides.length - 1 ? [0.1, 0.3, 0.3] : [0.1, 0.3, 0.1],
                        extrapolate: 'clamp',
                      }) : 0.3,
                      shadowRadius: bannerWidth > 40 ? scrollX.interpolate({
                        inputRange: [
                          index === 0 ? 0 : (index - 1) * bannerWidth,
                          index * bannerWidth,
                          index === promoSlides.length - 1 ? index * bannerWidth : (index + 1) * bannerWidth,
                        ],
                        outputRange: index === 0 ? [12, 12, 4] : index === promoSlides.length - 1 ? [4, 12, 12] : [4, 12, 4],
                        extrapolate: 'clamp',
                      }) : 12,
                      elevation: bannerWidth > 40 ? scrollX.interpolate({
                        inputRange: [
                          index === 0 ? 0 : (index - 1) * bannerWidth,
                          index * bannerWidth,
                          index === promoSlides.length - 1 ? index * bannerWidth : (index + 1) * bannerWidth,
                        ],
                        outputRange: index === 0 ? [8, 8, 2] : index === promoSlides.length - 1 ? [2, 8, 8] : [2, 8, 2],
                        extrapolate: 'clamp',
                      }) : 8,
                    }
                  ]}
              > 
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
              </Animated.View>
            ))}
          </Animated.ScrollView>
          <Animated.View 
                    style={[
              styles.dotsRow,
              {
                opacity: bannerWidth > 40 ? scrollX.interpolate({
                  inputRange: [0, bannerWidth * 0.5],
                  outputRange: [1, 0.8],
                  extrapolate: 'clamp',
                }) : 1,
              }
            ]}
          >
            {promoSlides.map((_, i) => {
              const isActive = i === currentPromoIndex;
              
              return (
                <Animated.View 
                  key={`dash-${i}`} 
                  style={[
                    styles.dash, 
                    { 
                      backgroundColor: BROWN_DARK, 
                      width: bannerWidth > 40 ? scrollX.interpolate({
                        inputRange: [
                          i === 0 ? 0 : (i - 1) * bannerWidth,
                          i * bannerWidth,
                          i === promoSlides.length - 1 ? i * bannerWidth : (i + 1) * bannerWidth,
                        ],
                        outputRange: i === 0 ? [48, 48, 16] : i === promoSlides.length - 1 ? [16, 48, 48] : [16, 48, 16],
                        extrapolate: 'clamp',
                      }) : (i === currentPromoIndex ? 48 : 16),
                      height: bannerWidth > 40 ? scrollX.interpolate({
                        inputRange: [
                          i === 0 ? 0 : (i - 1) * bannerWidth,
                          i * bannerWidth,
                          i === promoSlides.length - 1 ? i * bannerWidth : (i + 1) * bannerWidth,
                        ],
                        outputRange: i === 0 ? [7, 7, 3] : i === promoSlides.length - 1 ? [3, 7, 7] : [3, 7, 3],
                        extrapolate: 'clamp',
                      }) : (i === currentPromoIndex ? 7 : 3),
                      opacity: bannerWidth > 40 ? scrollX.interpolate({
                        inputRange: [
                          i === 0 ? 0 : (i - 1) * bannerWidth,
                          i * bannerWidth,
                          i === promoSlides.length - 1 ? i * bannerWidth : (i + 1) * bannerWidth,
                        ],
                        outputRange: i === 0 ? [1, 1, 0.4] : i === promoSlides.length - 1 ? [0.4, 1, 1] : [0.4, 1, 0.4],
                        extrapolate: 'clamp',
                      }) : (i === currentPromoIndex ? 1 : 0.4),
                    }
                  ]} 
                />
              );
            })}
          </Animated.View>
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
            products.map((p) => {
              const imageUri = getProductImageUri(p);
              return (
                <TouchableOpacity key={p.id} style={styles.productCard} onPress={() => {
                  console.log('🚀 Navigating to product:', p.id, 'Type:', typeof p.id);
                  router.push(`/product/${p.id}` as any);
                }} activeOpacity={0.85}>
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.productImage}
                    defaultSource={{ uri: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center&q=60' }}
                    onError={(error) => {
                      // Only log if it's not a placeholder image failing
                      if (!imageUri.includes('via.placeholder.com')) {
                        console.warn(`Failed to load image for product ${p.id}: ${imageUri}`, error.nativeEvent?.error);
                      }
                    }}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={2}>{p.name_ar || p.name || 'منتج'}</Text>
                    {p.base_price && (
                      <Text style={styles.productPrice}>{p.base_price} ريال</Text>
                    )}
                    <View style={styles.productBtn}>
                      <Text style={styles.productBtnText}>عرض</Text>
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
  categoryItem: {
    alignItems: 'center',
    marginBottom: 0,
    marginHorizontal: 8,
  },
  categoryCard: {
    backgroundColor: 'transparent',
    width: 90,
    height: 88,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  categoryLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: BROWN_DARK,
    lineHeight: 14,
    fontFamily: 'NotoSansArabic_500Medium',
    marginTop: 4,
  },
  categoriesScrollContent: {
    paddingHorizontal: 8,
    gap: 8,
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
