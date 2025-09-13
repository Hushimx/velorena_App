import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { getCategories } from '../../utils/api';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48) / 2; // 2 columns with padding

interface CategoryCardProps {
  category: any;
  onPress: () => void;
}

const CategoryCard = ({ category, onPress }: CategoryCardProps) => {
  return (
    <TouchableOpacity
      style={[styles.categoryCard, { width: CARD_WIDTH }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {category.image ? (
          <Image
            source={{ uri: category.image }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.iconContainer}>
            <FontAwesome6 name="book" size={32} color={BRAND_COLORS.primary} />
          </View>
        )}
      </View>
      
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryTitle} numberOfLines={2}>
          {category.name_ar || category.name || 'قسم'}
        </Text>
        {category.description_ar && (
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {category.description_ar}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await getCategories({ page: 1, limit: 50 });
        if (response?.data?.data) {
          setCategories(response.data.data);
        }
      } catch (err: any) {
        console.error('Failed to load categories:', err);
        setError('فشل في تحميل الأقسام');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const renderCategory = ({ item }: { item: any }) => (
    <CategoryCard
      category={item}
      onPress={() => router.push(`/category/${item.id}` as any)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الأقسام</Text>
        </View>

        {/* Categories Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loadingText}>جاري تحميل الأقسام...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
                // Retry logic would go here
              }}
            >
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>لا توجد أقسام متاحة</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    direction: 'rtl',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: BRAND_COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryText: {
    color: BRAND_COLORS.background.primary,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  flatListContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 120,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  categoryInfo: {
    padding: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    marginBottom: 4,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  categoryDescription: {
    fontSize: 12,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});
