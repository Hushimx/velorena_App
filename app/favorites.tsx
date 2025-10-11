import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { ErrorState } from '../components/ErrorState';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { TextLineSkeleton } from '../components/Skeleton';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useFavorites } from '../hooks/useFavorites';
import { useSkeletonLoading } from '../hooks/useSkeletonLoading';
import { getImageUrl } from '../utils/api';

const COLORS = {
  primary: BRAND_COLORS.primary,
  secondary: BRAND_COLORS.secondary,
  white: BRAND_COLORS.white,
  gray: BRAND_COLORS.gray,
  danger: BRAND_COLORS.error,
};

export default function FavoritesScreen() {
  const router = useRouter();
  const {
    favorites,
    loading,
    error,
    isRefreshing,
    refresh,
    removeFavorite,
    count,
    isAuthenticated,
  } = useFavorites();

  // Skeleton loading with minimum display time
  const showSkeleton = useSkeletonLoading({ 
    isLoading: loading && favorites.length === 0, 
    minimumDisplayTime: 1000 
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login' as any);
    }
  }, [isAuthenticated, router]);

  const handleRemoveFavorite = (productId: number, productName: string) => {
    Alert.alert(
      'إزالة من المفضلة',
      `هل أنت متأكد من إزالة "${productName}" من المفضلة؟`,
      [
        {
          text: 'إلغاء',
          style: 'cancel'
        },
        {
          text: 'إزالة',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFavorite(productId);
            if (!success) {
              Alert.alert('خطأ', 'فشل في إزالة المنتج من المفضلة');
            }
          }
        }
      ]
    );
  };

  const handleProductPress = (productId: number) => {
    router.push(`/product/${productId}` as any);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2
    }).format(price);
  };

  const renderFavoriteItem = ({ item }: any) => {
    const product = item.product;
    const imageUrl = getImageUrl(product.image_url);

    return (
      <TouchableOpacity
        style={styles.favoriteCard}
        onPress={() => handleProductPress(product.id)}
        activeOpacity={0.7}
      >
        <View style={styles.favoriteContent}>
          {/* Product Image */}
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.imagePlaceholder]}>
              <MaterialIcons name="image" size={32} color={COLORS.gray[400]} />
            </View>
          )}

          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name_ar || product.name}
            </Text>
            {product.description_ar || product.description ? (
              <Text style={styles.productDescription} numberOfLines={2}>
                {product.description_ar || product.description}
              </Text>
            ) : null}
            <Text style={styles.productPrice}>
              {formatPrice(product.price)}
            </Text>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(product.id, product.name_ar || product.name)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="favorite" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="favorite-border" size={80} color={COLORS.gray[300]} />
      <Text style={styles.emptyTitle}>لا توجد منتجات مفضلة</Text>
      <Text style={styles.emptySubtitle}>
        ابدأ بإضافة منتجات إلى المفضلة لتظهر هنا
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.push('/(tabs)/' as any)}
        activeOpacity={0.8}
      >
        <Text style={styles.browseButtonText}>تصفح المنتجات</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backButton} />
        <View style={styles.headerTitle} />
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.skeletonList}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={styles.skeletonCard}>
            <View style={styles.skeletonContent}>
              <TextLineSkeleton width={80} height={80} />
              <View style={styles.skeletonInfo}>
                <TextLineSkeleton width="80%" height={18} />
                <TextLineSkeleton width="60%" height={14} />
                <TextLineSkeleton width="40%" height={16} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  if (showSkeleton) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        {renderSkeleton()}
      </SafeAreaWrapper>
    );
  }

  if (error && favorites.length === 0) {
    return (
      <SafeAreaWrapper backgroundColor={COLORS.white}>
        <ErrorState
          title="حدث خطأ"
          message={error}
          onRetry={refresh}
          retryText="إعادة المحاولة"
          fullScreen
        />
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={COLORS.white} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المفضلة {count > 0 ? `(${count})` : ''}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Favorites List */}
      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => `favorite-${item.id}`}
        contentContainerStyle={[
          styles.listContent,
          favorites.length === 0 && styles.listContentEmpty
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    writingDirection: 'rtl',
  },

  // Header
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerSpacer: {
    width: 44,
  },

  // List
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING['4xl'],
  },
  listContentEmpty: {
    flex: 1,
  },

  // Favorite Card
  favoriteCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  favoriteContent: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[100],
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderStyle: 'dashed',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  productDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs,
    textAlign: 'right',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  removeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    marginBottom: SPACING['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  browseButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },

  // Skeleton
  skeletonList: {
    padding: SPACING.lg,
  },
  skeletonCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: SPACING.md,
  },
  skeletonContent: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  skeletonInfo: {
    flex: 1,
    gap: SPACING.sm,
  },
});
