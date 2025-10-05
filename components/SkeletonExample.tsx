import React from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { 
  BannerSkeleton, 
  CategoriesSkeleton, 
  ProductsGridSkeleton, 
  HorizontalProductsSkeleton,
  TextLineSkeleton 
} from './Skeleton';
import { BRAND_COLORS, SPACING } from '../constants/Theme';

/**
 * Example component showing how to use skeleton loading components
 * This demonstrates the different skeleton types available
 */
export const SkeletonExample: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Skeleton Loading Examples</Text>
      
      {/* Banner Skeleton */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Banner Skeleton</Text>
        <BannerSkeleton />
      </View>

      {/* Categories Skeleton */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories Skeleton</Text>
        <CategoriesSkeleton count={6} />
      </View>

      {/* Products Grid Skeleton */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products Grid Skeleton</Text>
        <ProductsGridSkeleton count={4} />
      </View>

      {/* Horizontal Products Skeleton */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Horizontal Products Skeleton</Text>
        <HorizontalProductsSkeleton count={3} />
      </View>

      {/* Text Lines Skeleton */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Lines Skeleton</Text>
        <View style={styles.textContainer}>
          <TextLineSkeleton width="100%" height={20} />
          <TextLineSkeleton width="80%" height={16} />
          <TextLineSkeleton width="60%" height={16} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
    padding: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  textContainer: {
    gap: SPACING.sm,
  },
});


