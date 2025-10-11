import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { getImageUrl } from '../utils/api';

interface ProductCardProps {
  product: any;
  variant?: 'grid' | 'horizontal';
  onPress?: () => void;
}

export default function ProductCard({ product, variant = 'grid', onPress }: ProductCardProps) {
  const router = useRouter();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const cardBounceAnim = useRef(new Animated.Value(0)).current;

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

  // Get image URL using the centralized getImageUrl utility
  const getProductImageSource = () => {
    // Try different image fields in order of priority
    const imageUrl = getImageUrl(
      product.image_url || 
      product.image || 
      product.main_image ||
      (product.images && product.images.length > 0 ? product.images[0] : null)
    );
    
    if (imageUrl) {
      return { uri: imageUrl };
    }
    
    // Fallback to placeholder
    return require('../assets/images/catagory-placeholer.png');
  };
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
        <View style={styles.imageContainer}>
          {!imageError ? (
            <>
              <Image 
                source={{
                  ...getProductImageSource(),
                  cache: 'force-cache'
                }}
                style={[
                  styles.productImage,
                  variant === 'horizontal' ? styles.horizontalImage : styles.gridImage
                ]}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              {imageLoading && (
                <View style={[
                  styles.imageLoadingOverlay,
                  variant === 'horizontal' ? styles.horizontalImage : styles.gridImage
                ]}>
                  <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
                </View>
              )}
            </>
          ) : (
            <View style={[
              styles.placeholderImage,
              variant === 'horizontal' ? styles.horizontalImage : styles.gridImage
            ]}>
              <Text style={styles.placeholderText}>لا توجد صورة</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={[
            styles.productTitle,
            variant === 'horizontal' ? styles.horizontalTitle : styles.gridTitle
          ]} numberOfLines={2}>
            {product.name_ar || product.name || 'منتج'}
          </Text>
          
        </View>
        
        <Animated.View style={{ transform: [{ scale: heartScaleAnim }] }}>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    direction: 'rtl',
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: BRAND_COLORS.background.primary,
    ...SHADOWS.md,
    position: 'relative',
    elevation: 4,
    width: '100%',
  },
  gridCard: {
    // Grid specific styles
  },
  horizontalCard: {
    // Horizontal specific styles
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  gridImage: {
    height: 160,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  horizontalImage: {
    height: 140,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BRAND_COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderImage: {
    width: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
  },
  productInfo: {
    padding: SPACING.md,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flex: 1,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
 

  productTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    paddingTop: 2,
    paddingBottom: 2,
  },
  gridTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 16,
  },
  horizontalTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 18,
  },


});
