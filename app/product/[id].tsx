import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AnimatedDots from '../../components/AnimatedDots';
import AuthBottomSheet from '../../components/AuthBottomSheet';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { useAuthPrompt } from '../../hooks/useAuthPrompt';
import { buildCartItemKey, useCartStore } from '../../store/useCartStore';
import { getImageUrl, getProductDetail, getProductReviews, Review, ReviewStats } from '../../utils/api';
import { useIsFavorite } from '../../hooks/useFavorites';

// Theme colors
const PRIMARY = '#2a1e1e';
const SECONDARY = '#ffde9f';
const TEXT_PRIMARY = '#2a1e1e';
const TEXT_SECONDARY = '#6b7280';
const GRAY_LIGHT = '#f3f4f6';
const GRAY_MEDIUM = '#9ca3af';
const WHITE = '#ffffff';
const BACKGROUND_COLOR = '#ffffff';


// Helper function to get all product images using getImageUrl
const getProductImages = (product: any): string[] => {
  const images: string[] = [];
  
  // First, add main product image if it exists
  if (product?.image_url && typeof product.image_url === 'string' && product.image_url.trim()) {
    const mainImageUrl = getImageUrl(product.image_url);
    if (mainImageUrl) {
      images.push(mainImageUrl);
    }
  } else if (product?.image && typeof product.image === 'string' && product.image.trim()) {
    const mainImageUrl = getImageUrl(product.image);
    if (mainImageUrl) {
      images.push(mainImageUrl);
    }
  }
  
  // Then, process additional images array
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((img: any) => {
      // Handle string directly
      if (typeof img === 'string' && img.trim()) {
        const imageUrl = getImageUrl(img);
        if (imageUrl && !images.includes(imageUrl)) {
          images.push(imageUrl);
        }
      } 
      // Handle object with image properties
      else if (img && typeof img === 'object') {
        // Try different image field names (image_url, image_path, url, image)
        const imgPath = img.image_url || img.image_path || img.url || img.image;
        
        if (imgPath && typeof imgPath === 'string' && imgPath.trim()) {
          const imageUrl = getImageUrl(imgPath);
          if (imageUrl && !images.includes(imageUrl)) {
            images.push(imageUrl);
          }
        }
      }
    });
  }
  
  // Return images or fallback
  return images.length > 0 ? images : [getImageUrl('') || 'https://placehold.co/600x400.png'];
};

// Product option types based on API structure
type OptionValue = {
  id: number;
  value: string;
  value_ar: string;
  price_adjustment: string;
  is_active: boolean;
  sort_order: number;
  image_url?: string;
  image?: string;
};

type ProductOption = {
  id: number;
  name: string;
  name_ar: string;
  type: string;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  values: OptionValue[];
};

type OptionSelection = Record<string, string>; // optionId -> valueId (as strings for cart compatibility)

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  
  // State
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<OptionSelection>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  // Favorites hook
  const { isFavorited, isToggling, toggle: toggleFavorite } = useIsFavorite(
    product?.id ? Number(product.id) : 0
  );
  
  // Animation for favorite button
  const favoriteScale = useRef(new Animated.Value(1)).current;
  
  const animateFavoriteButton = () => {
    Animated.sequence([
      Animated.timing(favoriteScale, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(favoriteScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  // Fetch product data
  useEffect(() => {
    if (!id) return;
    
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        
        const response = await getProductDetail(id);
        setProduct(response?.data);
        
      } catch (fetchError: any) {
        setError(fetchError?.message || 'Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Fetch reviews data
  useEffect(() => {
    if (!id) return;
    
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        
        const response = await getProductReviews(id, { per_page: 10 });
        if (response.success && response.data) {
          setReviews(response.data.reviews);
          setReviewStats(response.data.rating_stats);
        }
        
      } catch (fetchError: any) {
        setReviewsError(fetchError?.message || 'Failed to load reviews');
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Event handlers
  const onSelect = (optionId: number, valueId: number) =>
    setSelections((s) => ({ ...s, [String(optionId)]: String(valueId) }));

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };
  
  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const { addItem, items, loadingItems: cartLoading } = useCartStore();
  
  // Auth prompt hook
  const { authBottomSheetRef, customMessage, checkAuthAndPrompt } = useAuthPrompt();
  
  // Check if current product with options is in cart
  const getCurrentCartItem = () => {
    if (!product) return null;
    const itemKey = buildCartItemKey({
      id: String(product.id ?? product._id ?? id),
      options: selections,
    });
    return items.find(item => buildCartItemKey(item) === itemKey);
  };

  const currentCartItem = getCurrentCartItem();
  const isInCart = !!currentCartItem;

  // Memoize product images to prevent recalculation on every render
  const productImages = useMemo(() => {
    if (!product) return [];
    const images = getProductImages(product);
    return images;
  }, [product]);

  // Calculate total price including option adjustments
  const calculateTotalPrice = () => {
    if (!product) return 0;
    
    let basePrice = Number(product.base_price || product.price || 0);
    
    // Add option price adjustments
    Object.entries(selections).forEach(([optionId, valueId]) => {
      const option = product.options?.find((opt: ProductOption) => String(opt.id) === optionId);
      if (option) {
        const value = option.values.find((val: OptionValue) => String(val.id) === valueId);
        if (value && value.price_adjustment) {
          basePrice += Number(value.price_adjustment);
        }
      }
    });
    
    return basePrice;
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Validate required options
    const requiredOptions = product.options?.filter((opt: ProductOption) => opt.is_required) || [];
    for (const option of requiredOptions) {
      if (!selections[String(option.id)]) {
        Alert.alert('خطأ', `الرجاء اختيار ${option.name_ar || option.name}`);
        return;
      }
    }
    
    checkAuthAndPrompt(async () => {
      const price = calculateTotalPrice();
      
      try {
        await addItem(
          {
            id: String(product.id ?? product._id ?? id),
            name: product.name,
            name_ar: product.name_ar,
            description: product.description,
            description_ar: product.description_ar,
            image: productImages[0],
            price,
            options: selections,
          },
          quantity
        );
        Alert.alert('تم', 'تمت إضافة المنتج إلى السلة', [
          { text: 'متابعة التسوق', style: 'cancel' },
          { text: 'عرض السلة', onPress: () => router.push('/(tabs)/cart') }
        ]);
      } catch (error: any) {
        console.error('Add to cart error:', error);
        Alert.alert('خطأ', error.message || 'فشل في إضافة المنتج إلى السلة');
      }
    }, 'يجب تسجيل الدخول لإضافة منتجات إلى السلة');
  };

  const handleViewCart = () => {
    router.push('/cart');
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor={BACKGROUND_COLOR}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>جاري تحميل المنتج...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaWrapper backgroundColor={BACKGROUND_COLOR}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  // No product found
  if (!product) {
    return (
      <SafeAreaWrapper backgroundColor={BACKGROUND_COLOR}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>المنتج غير موجود</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={BACKGROUND_COLOR}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Images Carousel */}
        <View style={styles.imageContainer} onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const width = carouselWidth || e.nativeEvent.layoutMeasurement.width || 1;
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              if (index !== activeImageIndex) setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
            style={{ width: '100%', height: 350 }}
            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 0 }}
          >
            {productImages.map((imageUri: string, index: number) => (
              <View key={`image-wrapper-${index}`} style={{ width: carouselWidth || 375, height: 350, paddingHorizontal: 0 }}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
          
          {/* Top Buttons Row - Favorite */}
          <View style={styles.topButtonsRow}>
            <TouchableOpacity 
              style={styles.topButton}
              onPress={async () => {
                if (product?.id) {
                  checkAuthAndPrompt(async () => {
                    animateFavoriteButton();
                    await toggleFavorite();
                  }, 'يجب تسجيل الدخول لإضافة منتجات إلى المفضلة');
                }
              }}
              activeOpacity={0.8}
              disabled={isToggling}
            >
              <Animated.View style={{ transform: [{ scale: favoriteScale }] }}>
                <MaterialIcons 
                  name={isFavorited ? "favorite" : "favorite-border"} 
                  size={24} 
                  color={isFavorited ? '#ef4444' : '#2a1e1e'} 
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
          
          {/* Dots Indicator */}
          <AnimatedDots
            count={productImages.length}
            activeIndex={activeImageIndex}
            dotColor="rgba(42, 30, 30, 0.2)"
            activeDotColor={PRIMARY}
            dotSize={8}
            activeDotSize={24}
            duration={300}
            gap={6}
            style={styles.dotsRow}
          />
        </View>



        {/* Product Title - Full Row */}
        <View style={styles.titleContainer}>
          <Text style={styles.productTitle}>
            {product.name_ar || product.name}
          </Text>
        </View>

        {/* Star Rating Section - Full Row */}
        <View style={styles.ratingContainer}>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => {
              const averageRating = reviewStats?.average || 0;
              const isFilled = star <= Math.round(averageRating);
              return (
                <MaterialIcons 
                  key={star} 
                  name={isFilled ? "star" : "star-border"} 
                  size={20} 
                  color="#2a1e1e" 
                />
              );
            })}
          </View>
          <Text style={styles.reviewCount}>
            ({reviewStats?.total || 0} {reviewStats?.total === 1 ? 'تقييم' : 'تقييم'})
          </Text>
        </View>
        {/* Description Box with Price */}
        <View style={styles.descriptionCard}>
          <Text style={styles.description}>
            {product.description_ar || product.description}
          </Text>

        </View>

        {/* Product Options */}
        {product?.options?.map((option: ProductOption) => (
          <DynamicOptionSection
            key={option.id}
            option={option}
            selectedValueId={selections[String(option.id)]}
            onSelect={(valueId) => onSelect(option.id, valueId)}
          />
        ))}

        {/* Reviews Section */}
        <ReviewsSection 
          reviews={reviews}
          reviewStats={reviewStats}
          loading={reviewsLoading}
          error={reviewsError}
        />

        {/* Bottom padding for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer with Quantity Controls */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          {/* Quantity Controls */}
          <View style={styles.footerQuantityContainer}>
            <TouchableOpacity 
              style={styles.footerQuantityButton}
              onPress={increaseQuantity}
              activeOpacity={0.7}
            >
              <MaterialIcons name="add" size={20} color={WHITE} />
            </TouchableOpacity>
            <Text style={styles.footerQuantityText}>{quantity}</Text>
            <TouchableOpacity 
              style={styles.footerQuantityButton}
              onPress={decreaseQuantity}
              activeOpacity={0.7}
            >
              <MaterialIcons name="remove" size={20} color={WHITE} />
            </TouchableOpacity>
          </View>

          {/* Add to Cart / View Cart Button */}
          {isInCart ? (
            <TouchableOpacity
              style={styles.viewCartButton}
              onPress={handleViewCart}
              activeOpacity={0.8}
            >
              <MaterialIcons name="shopping-cart" size={20} color={WHITE} />
              <Text style={styles.viewCartText}>عرض العربة</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.addToCartButton, cartLoading && { opacity: 0.6 }]}
              onPress={handleAddToCart}
              activeOpacity={0.8}
              disabled={cartLoading}
            >
              <MaterialIcons name="add-shopping-cart" size={20} color={WHITE} />
              <Text style={styles.addToCartText}>
                {cartLoading ? 'جاري الإضافة...' : 'اضافة الى عربة التسوق'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Auth Bottom Sheet */}
      <AuthBottomSheet
        bottomSheetRef={authBottomSheetRef}
        title="تسجيل الدخول مطلوب"
        message={customMessage || "يجب تسجيل الدخول أولاً للوصول إلى هذه الميزة"}
      />
    </SafeAreaWrapper>
  );
}

/* ========== Reusable Components ========== */

function Section({
  title,
  children,
  isRequired,
}: {
  title: string;
  children: React.ReactNode;
  isRequired?: boolean;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {title}
          {isRequired && <Text style={styles.requiredMark}> *</Text>}
        </Text>
      </View>
      {children}
    </View>
  );
}

function ReviewsSection({
  reviews,
  reviewStats,
  loading,
  error,
}: {
  reviews: Review[];
  reviewStats: ReviewStats | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <Section title="تقييمات العملاء">
        <View style={styles.reviewsLoading}>
          <Text style={styles.reviewsLoadingText}>جاري تحميل التقييمات...</Text>
        </View>
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="تقييمات العملاء">
        <View style={styles.reviewsError}>
          <Text style={styles.reviewsErrorText}>فشل في تحميل التقييمات</Text>
        </View>
      </Section>
    );
  }

  if (!reviewStats || reviewStats.total === 0) {
    return (
      <Section title="تقييمات العملاء">
        <View style={styles.noReviews}>
          <Text style={styles.noReviewsText}>لا توجد تقييمات بعد</Text>
        </View>
      </Section>
    );
  }

  return (
    <Section title="تقييمات العملاء">
      {/* Rating Summary */}
      <View style={styles.ratingSummary}>
        <View style={styles.ratingSummaryLeft}>
          <Text style={styles.averageRating}>{reviewStats.average.toFixed(1)}</Text>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= Math.round(reviewStats.average);
              return (
                <MaterialIcons 
                  key={star} 
                  name={isFilled ? "star" : "star-border"} 
                  size={16} 
                  color="#2a1e1e" 
                />
              );
            })}
          </View>
          <Text style={styles.totalReviews}>{reviewStats.total} تقييم</Text>
        </View>
        
        {/* Rating Distribution */}
        <View style={styles.ratingDistribution}>
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = reviewStats.distribution[rating] || 0;
            const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
            return (
              <View key={rating} style={styles.ratingBar}>
                <Text style={styles.ratingBarLabel}>{rating}⭐</Text>
                <View style={styles.ratingBarContainer}>
                  <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.ratingBarCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Reviews List */}
      <View style={styles.reviewsList}>
        {reviews.slice(0, 3).map((review) => (
          <View key={review.id} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>
                {review.user?.name ? 
                  (review.user.name.split(' ')[0] + ' ' + (review.user.name.split(' ')[1]?.[0] || '') + '.') :
                  'مجهول'
                }
              </Text>
              <View style={styles.reviewRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialIcons 
                    key={star} 
                    name={star <= review.rating ? "star" : "star-border"} 
                    size={14} 
                    color="#2a1e1e" 
                  />
                ))}
              </View>
              {review.is_verified_purchase && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={14} color="#22c55e" />
                  <Text style={styles.verifiedText}>مؤكد</Text>
                </View>
              )}
            </View>
            {review.comment_ar || review.comment ? (
              <Text style={styles.reviewComment}>
                {review.comment_ar || review.comment}
              </Text>
            ) : null}
            <Text style={styles.reviewDate}>
              {new Date(review.created_at).toLocaleDateString('ar-SA')}
            </Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

function DynamicOptionSection({
  option,
  selectedValueId,
  onSelect,
}: {
  option: ProductOption;
  selectedValueId?: string;
  onSelect: (valueId: number) => void;
}) {
  // Auto-select first value if none selected and option is required
  useEffect(() => {
    if (!selectedValueId && option.is_required && option.values.length > 0) {
      onSelect(option.values[0].id);
    }
  }, [option, selectedValueId, onSelect]);

  const displayName = option.name_ar || option.name;

  // All options render as radio button cards (single choice)
  return (
    <Section 
      title={displayName} 
      isRequired={option.is_required}
    >
      <View style={styles.optionsList}>
        {option.values.map((value) => {
          const isSelected = selectedValueId === String(value.id);
          const imageSource = value.image_url || value.image;
          const imageUrl = imageSource ? getImageUrl(imageSource) : null;
          
          return (
            <TouchableOpacity
              key={value.id}
              onPress={() => onSelect(value.id)}
              style={[styles.optionItemCard, isSelected && styles.optionItemCardSelected]}
              activeOpacity={0.7}
            >
              {imageUrl && (
                <Image 
                  source={{ uri: imageUrl }} 
                  style={styles.optionItemImage}
                />
              )}
              <View style={styles.optionItemContent}>
                <Text style={[styles.optionItemText, isSelected && styles.optionItemTextSelected]}>
                  {value.value_ar || value.value}
                </Text>
                {value.price_adjustment && parseFloat(value.price_adjustment) !== 0 && (
                  <Text style={styles.optionItemSubtext}>
                    {parseFloat(value.price_adjustment) > 0 ? '+' : ''}{value.price_adjustment} ر.س
                  </Text>
                )}
              </View>
              <View style={[styles.radioCircleNew, isSelected && styles.radioCircleNewSelected]}>
                {isSelected && <View style={styles.radioInnerNew} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Section>
  );
}

/* ========== Styles ========== */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BACKGROUND_COLOR,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    position: 'relative',
    backgroundColor: '#F5D5E0',
    marginTop: 0,
    paddingHorizontal: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  topButtonsRow: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    width: '100%',
  },
  titleContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    paddingTop: 8,
  },
  productTitle: {
    fontSize: 28,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: PRIMARY,
    textAlign: 'right',
    lineHeight: 36,
    paddingTop: 4,
    paddingBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginRight: 8,
  },
  reviewCount: {
    fontSize: 13,
    fontFamily: 'NotoSansArabic_400Regular',
    color: TEXT_SECONDARY,
  },
  descriptionCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFDEA1',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  description: {
    color: '#5a4a3a',
    lineHeight: 26,
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_500Medium',
    fontSize: 16,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceValue: {
    fontSize: 32,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: PRIMARY,
  },
  priceLabel: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: PRIMARY,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: WHITE,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 17,
    color: PRIMARY,
    textAlign: 'left',
  },
  requiredMark: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 18,
    color: '#ef4444',
  },
  optionsList: {
    gap: 12,
  },
  optionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  optionItemCardSelected: {
    borderColor: PRIMARY,
    backgroundColor: '#fff8e6',
    borderWidth: 2.5,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  optionItemImage: {
    width: 65,
    height: 65,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  optionItemContent: {
    flex: 1,
  },
  optionItemText: {
    fontFamily: 'NotoSansArabic_600SemiBold',
    fontSize: 15,
    color: PRIMARY,
    textAlign: 'left',
    lineHeight: 22,
  },
  optionItemTextSelected: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 15,
  },
  optionItemSubtext: {
    fontFamily: 'NotoSansArabic_500Medium',
    fontSize: 13,
    color: '#22c55e',
    marginTop: 4,
    textAlign: 'left',
  },
  radioCircleNew: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHITE,
  },
  radioCircleNewSelected: {
    borderColor: PRIMARY,
    borderWidth: 2.5,
  },
  radioInnerNew: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PRIMARY,
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: GRAY_LIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
    minWidth: 100,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: GRAY_MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: PRIMARY,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },
  radioText: {
    fontSize: 13,
    fontFamily: 'NotoSansArabic_500Medium',
    color: PRIMARY,
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WHITE,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownHeaderOpen: {
    borderColor: PRIMARY,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownHeaderContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: PRIMARY,
    textAlign: 'right',
  },
  dropdownPlaceholder: {
    color: TEXT_SECONDARY,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  dropdownPriceAdjustment: {
    fontSize: 14,
    fontFamily: 'NotoSansArabic_500Medium',
    color: TEXT_SECONDARY,
    marginTop: 2,
    textAlign: 'right',
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: {
    backgroundColor: '#fef7e6',
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: 'NotoSansArabic_500Medium',
    color: PRIMARY,
    textAlign: 'right',
  },
  dropdownItemTextActive: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: PRIMARY,
  },
  dropdownItemPrice: {
    fontSize: 13,
    fontFamily: 'NotoSansArabic_500Medium',
    color: TEXT_SECONDARY,
    marginTop: 2,
    textAlign: 'right',
  },
  dropdownItemPriceActive: {
    color: PRIMARY,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footerQuantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  footerQuantityText: {
    fontSize: 18,
    fontFamily: 'NotoSansArabic_700Bold',
    color: PRIMARY,
    minWidth: 30,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addToCartText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: WHITE,
    fontSize: 16,
  },
  viewCartButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  viewCartText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: WHITE,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'NotoSansArabic_700Bold',
    color: TEXT_PRIMARY,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: SECONDARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: PRIMARY,
  },
  priceAdjustment: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  // Reviews styles
  reviewsLoading: {
    padding: 20,
    alignItems: 'center',
  },
  reviewsLoadingText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  reviewsError: {
    padding: 20,
    alignItems: 'center',
  },
  reviewsErrorText: {
    fontSize: 14,
    color: '#ef4444',
    fontFamily: 'NotoSansArabic_500Medium',
  },
  noReviews: {
    padding: 20,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  ratingSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 20,
  },
  ratingSummaryLeft: {
    alignItems: 'center',
    minWidth: 80,
  },
  averageRating: {
    fontSize: 32,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: PRIMARY,
    marginBottom: 4,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  totalReviews: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  ratingDistribution: {
    flex: 1,
    gap: 6,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBarLabel: {
    fontSize: 12,
    color: TEXT_PRIMARY,
    fontFamily: 'NotoSansArabic_600SemiBold',
    minWidth: 20,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: SECONDARY,
    borderRadius: 4,
  },
  ratingBarCount: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontFamily: 'NotoSansArabic_500Medium',
    minWidth: 20,
    textAlign: 'left',
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: PRIMARY,
    flex: 1,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  verifiedText: {
    fontSize: 10,
    color: '#22c55e',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  reviewComment: {
    fontSize: 14,
    color: TEXT_PRIMARY,
    fontFamily: 'NotoSansArabic_400Regular',
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'right',
  },
  reviewDate: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontFamily: 'NotoSansArabic_400Regular',
    textAlign: 'right',
  },
});
