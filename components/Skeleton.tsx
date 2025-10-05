import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Skeleton } from 'moti/skeleton';
import { BRAND_COLORS, BORDER_RADIUS, SPACING } from '../constants/Theme';

interface BaseSkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | 'round' | 'square';
  colorMode?: 'light' | 'dark';
  style?: any;
}

export const BaseSkeleton: React.FC<BaseSkeletonProps> = ({
  width = '100%',
  height = 20,
  radius = BORDER_RADIUS.md,
  colorMode = 'light',
  style,
}) => {
  return (
    <Skeleton
      colorMode={colorMode}
      radius={radius}
      width={width}
      height={height}
      style={style}
    />
  );
};

// Product Card Skeleton
interface ProductCardSkeletonProps {
  variant?: 'grid' | 'horizontal';
  style?: any;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
  variant = 'grid',
  style,
}) => {
  const cardWidth = variant === 'horizontal' ? 160 : '48%';
  const imageHeight = variant === 'horizontal' ? 140 : 160;

  return (
    <View style={[styles.productCard, { width: cardWidth }, style]}>
      <Skeleton
        colorMode="light"
        radius={BORDER_RADIUS.lg}
        width="100%"
        height={imageHeight}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Skeleton
          colorMode="light"
          radius={BORDER_RADIUS.sm}
          width="90%"
          height={16}
          style={styles.productTitle}
        />
        <Skeleton
          colorMode="light"
          radius={BORDER_RADIUS.sm}
          width="70%"
          height={14}
          style={styles.productSubtitle}
        />
      </View>
    </View>
  );
};

// Category Skeleton
interface CategorySkeletonProps {
  style?: any;
}

export const CategorySkeleton: React.FC<CategorySkeletonProps> = ({ style }) => {
  const { width: screenWidth } = Dimensions.get('window');
  const cardWidth = (screenWidth - 64) / 2; // 2 columns with padding
  
  return (
    <View style={[styles.categoryCard, { width: cardWidth }, style]}>
      <Skeleton
        colorMode="light"
        radius={BORDER_RADIUS.lg}
        width="100%"
        height={120}
        style={styles.categoryImage}
      />
      <View style={styles.categoryInfo}>
        <Skeleton
          colorMode="light"
          radius={BORDER_RADIUS.sm}
          width="80%"
          height={16}
          style={styles.categoryTitle}
        />
      </View>
    </View>
  );
};

// Banner Skeleton
interface BannerSkeletonProps {
  style?: any;
}

export const BannerSkeleton: React.FC<BannerSkeletonProps> = ({ style }) => {
  return (
    <Skeleton
      colorMode="light"
      radius={BORDER_RADIUS.lg}
      width="100%"
      height={180}
      style={[styles.banner, style]}
    />
  );
};

// Text Line Skeleton
interface TextLineSkeletonProps {
  width?: number | string;
  height?: number;
  style?: any;
}

export const TextLineSkeleton: React.FC<TextLineSkeletonProps> = ({
  width = '100%',
  height = 16,
  style,
}) => {
  return (
    <Skeleton
      colorMode="light"
      radius={BORDER_RADIUS.sm}
      width={width}
      height={height}
      style={style}
    />
  );
};

// Grid Products Skeleton
interface ProductsGridSkeletonProps {
  count?: number;
  style?: any;
}

export const ProductsGridSkeleton: React.FC<ProductsGridSkeletonProps> = ({
  count = 6,
  style,
}) => {
  return (
    <View style={[styles.productsGrid, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} variant="grid" />
      ))}
    </View>
  );
};

// Horizontal Products Skeleton
interface HorizontalProductsSkeletonProps {
  count?: number;
  style?: any;
}

export const HorizontalProductsSkeleton: React.FC<HorizontalProductsSkeletonProps> = ({
  count = 5,
  style,
}) => {
  return (
    <View style={[styles.horizontalContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} variant="horizontal" />
      ))}
    </View>
  );
};

// Categories Skeleton
interface CategoriesSkeletonProps {
  count?: number;
  style?: any;
}

export const CategoriesSkeleton: React.FC<CategoriesSkeletonProps> = ({
  count = 12,
  style,
}) => {
  // Calculate rows needed for 2 columns
  const rows = Math.ceil(count / 2);
  
  return (
    <View style={[styles.categoriesGridContainer, style]}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.categoriesRow}>
          {Array.from({ length: 2 }).map((_, colIndex) => {
            const itemIndex = rowIndex * 2 + colIndex;
            if (itemIndex >= count) return null;
            return <CategorySkeleton key={itemIndex} />;
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    marginBottom: SPACING.lg,
  },
  productImage: {
    borderRadius: BORDER_RADIUS.lg,
  },
  productInfo: {
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  productTitle: {
    marginBottom: SPACING.xs,
  },
  productSubtitle: {
    marginTop: SPACING.xs,
  },
  categoryCard: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  categoryInfo: {
    backgroundColor: BRAND_COLORS.background.primary,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  categoryTitle: {
    marginTop: 4,
  },
  banner: {
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.lg,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
  },
  horizontalContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    gap: SPACING.md,
  },
  categoriesGridContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 20,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});


