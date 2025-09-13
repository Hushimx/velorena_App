import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useCartStore } from '../store/useCartStore';

// Remove unused screenWidth

// Helper function to extract image URI from various API structures
const getProductImageUri = (product: any): string => {
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

interface ProductCardProps {
  product: any;
  variant?: 'grid' | 'horizontal';
  onPress?: () => void;
}

export default function ProductCard({ product, variant = 'grid', onPress }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const cardBounceAnim = useRef(new Animated.Value(0)).current;
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);

  // Entrance animation
  useEffect(() => {
    Animated.timing(cardBounceAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [cardBounceAnim]);

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/product/${product.id}` as any);
    }
  };

  const handleAddToCart = async () => {
    if (isAdding) return;
    
    console.log('Adding to cart:', product.id); // Debug log
    setIsAdding(true);
    
    // Simple button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await addItem({
        id: String(product.id),
        name: product.name_ar || product.name || 'منتج',
        price: product.base_price || 0,
        image: getProductImageUri(product),
      }, 1);

      // Show success feedback
      setShowCheckmark(true);
      Animated.timing(checkmarkOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Reset after delay
      setTimeout(() => {
        Animated.timing(checkmarkOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setShowCheckmark(false);
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleFavoritePress = () => {
    // Simple heart animation
    Animated.sequence([
      Animated.timing(heartScaleAnim, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartScaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setIsFavorite(!isFavorite);
  };

  const handleCardPressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const imageUri = getProductImageUri(product);
  const cardWidth = variant === 'horizontal' ? 160 : '48%';

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          width: cardWidth,
          transform: [
            { scale: Animated.multiply(scaleAnim, cardBounceAnim) },
            { translateY: Animated.multiply(cardBounceAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }), new Animated.Value(1)) }
          ],
          opacity: cardBounceAnim
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          variant === 'horizontal' ? styles.horizontalCard : styles.gridCard
        ]}
        onPress={handleCardPress}
        onPressIn={handleCardPressIn}
        onPressOut={handleCardPressOut}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: imageUri }} 
          style={[
            styles.productImage,
            variant === 'horizontal' ? styles.horizontalImage : styles.gridImage
          ]}
          defaultSource={{ uri: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center&q=60' }}
        />
        
        <View style={[
          styles.productInfo,
          variant === 'horizontal' ? styles.horizontalInfo : styles.gridInfo
        ]}>
          <Text style={[
            styles.productTitle,
            variant === 'horizontal' ? styles.horizontalTitle : styles.gridTitle
          ]} numberOfLines={2}>
            {product.name_ar || product.name || 'منتج'}
          </Text>
          
          {product.base_price && (
            <Text style={[
              styles.productPrice,
              variant === 'horizontal' ? styles.horizontalPrice : styles.gridPrice
            ]}>
              {product.base_price} ريال
            </Text>
          )}
          
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.addToCartBtn,
                variant === 'horizontal' ? styles.horizontalBtn : styles.gridBtn,
                showCheckmark && styles.successBtn
              ]}
               onPress={showCheckmark ? () => router.push('/cart' as any) : handleAddToCart}
               disabled={isAdding}
            >
              {showCheckmark ? (
                <Animated.View style={{ opacity: checkmarkOpacity }}>
                  <MaterialIcons name="check" size={16} color={BRAND_COLORS.secondary} />
                </Animated.View>
              ) : (
                <MaterialIcons name="shopping-cart" size={16} color={BRAND_COLORS.secondary} />
              )}
               <Text style={styles.addToCartBtnText}>
                 {showCheckmark ? 'عرض السلة' : 'أضف للسلة'}
               </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
          <TouchableOpacity
            style={[
              styles.favoriteBtn,
              variant === 'horizontal' && styles.horizontalFavoriteBtn
            ]}
            onPress={handleFavoritePress}
          >
            <MaterialIcons
              name={isFavorite ? "favorite" : "favorite-border"}
              size={20}
              color={isFavorite ? BRAND_COLORS.error : BRAND_COLORS.text.primary}
            />
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: BRAND_COLORS.background.primary,
    ...SHADOWS.md,
    position: 'relative',
    elevation: 4,
  },
  gridCard: {
    // Grid specific styles
  },
  horizontalCard: {
    // Horizontal specific styles
  },
  productImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  gridImage: {
    height: 160,
    borderRadius: BORDER_RADIUS.lg,
  },
  horizontalImage: {
    height: 140,
  },
  productInfo: {
    padding: SPACING.md,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
  },
  gridInfo: {
    minHeight: 80,
  },
  horizontalInfo: {
    minHeight: 90,
  },
  productTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  gridTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 16,
  },
  horizontalTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 18,
  },
  productPrice: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
    marginBottom: SPACING.sm,
  },
  gridPrice: {
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  horizontalPrice: {
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  addToCartBtn: {
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 20,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: 36,
    alignSelf: 'center',
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  gridBtn: {
    // Centered button for grid
  },
  horizontalBtn: {
    // Centered button for horizontal
  },
  successBtn: {
    backgroundColor: BRAND_COLORS.success || '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  addToCartBtnText: {
    color: BRAND_COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  favoriteBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  horizontalFavoriteBtn: {
    // Horizontal specific favorite button styles
  },
});
