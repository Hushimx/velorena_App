import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { EmptyState, ErrorState } from '../../components/ErrorState';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { CategoriesSkeleton } from '../../components/Skeleton';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useSkeletonLoading } from '../../hooks/useSkeletonLoading';
import { getCategories } from '../../utils/api';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 64) / 2; // 2 columns with padding

interface CategoryCardProps {
  category: any;
  onPress: () => void;
}

const CategoryCard = ({ category, onPress }: CategoryCardProps) => {
  // Use image_url (computed accessor) or main_image (direct field)
  const imageUrl = category.image_url || category.main_image;
  
  console.log('🎨 Rendering category:', category.name_ar, 'Image URL:', imageUrl);
  
  return (
    <TouchableOpacity
      style={[styles.categoryCard, { width: CARD_WIDTH }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {imageUrl ? (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.categoryImage}
          resizeMode="contain"
          onError={(e) => {
            console.error('❌ Image load error for', category.name_ar, ':', e.nativeEvent.error);
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully for', category.name_ar);
          }}
        />
      ) : (
        <View style={[styles.categoryImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 10, color: '#999' }}>لا توجد صورة</Text>
        </View>
      )}
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryTitle} numberOfLines={2}>
          {category.name_ar || category.name || 'قسم'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Skeleton loading with minimum display time
  const showSkeleton = useSkeletonLoading({ 
    isLoading: loading && categories.length === 0, 
    minimumDisplayTime: 1500 
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const response = await getCategories({ page: 1, limit: 50 });
        console.log('📦 Categories API Response:', JSON.stringify(response, null, 2));
        
        if (response?.data?.data) {
          const categoriesData = response.data.data;
          console.log('✅ Categories loaded:', categoriesData.length);
          
          // Log first category to check image data
          if (categoriesData[0]) {
            console.log('🖼️ First category data:', {
              id: categoriesData[0].id,
              name: categoriesData[0].name_ar,
              main_image: categoriesData[0].main_image,
              image: categoriesData[0].image,
              image_url: categoriesData[0].image_url,
              slider_image: categoriesData[0].slider_image
            });
          }
          
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('❌ Failed to load categories:', error);
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
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الأقسام</Text>
        </View>

        {/* Categories Grid */}
        {showSkeleton ? (
          <CategoriesSkeleton count={12} />
        ) : error ? (
          <ErrorState
            title="حدث خطأ"
            message={error}
            onRetry={() => {
              setError(null);
              setLoading(true);
              // Retry logic would go here
            }}
            retryText="إعادة المحاولة"
            fullScreen
          />
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
              <EmptyState
                title="لا توجد أقسام متاحة"
                message="لم يتم العثور على أي أقسام للعرض حالياً"
                iconName="category"
                style={styles.emptyContainer}
              />
            }
          />
        )}
      </View>
    </SafeAreaWrapper>
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
  flatListContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
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
    width: CARD_WIDTH,
  },
  categoryImage: {
    width: '100%',
    height: CARD_WIDTH, // Make it square - same as card width
    backgroundColor: BRAND_COLORS.gray[100],
  },
  categoryInfo: {
    backgroundColor: BRAND_COLORS.background.primary,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
