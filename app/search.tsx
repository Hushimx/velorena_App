import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ProductCard from '../components/ProductCard';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { getCategories, getHighlights, searchProducts } from '../utils/api';

// TypeScript Interfaces
interface Category {
  id: string;
  name: string;
  name_ar: string;
  image?: string;
}

interface Highlight {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  description_ar?: string;
  is_active: boolean;
  sort_order: number;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  name_ar: string;
  base_price?: number;
  image?: string;
  main_image?: string;
  images?: string[];
  category?: {
    id: string;
    name: string;
    name_ar: string;
  };
  highlights?: Highlight[];
}

// Default fallback categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'كتالوجات', name_ar: 'كتالوجات' },
  { id: '2', name: 'التغليف', name_ar: 'التغليف' },
  { id: '3', name: 'كراسات', name_ar: 'كراسات' },
  { id: '4', name: 'فلاير', name_ar: 'فلاير' },
  { id: '5', name: 'هدايا', name_ar: 'هدايا' }
];

// Default fallback highlights
const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { id: '1', name: 'عروض الربيع', name_ar: 'عروض الربيع', slug: 'spring-offers', is_active: true, sort_order: 1 },
  { id: '2', name: 'أفضل البائعين', name_ar: 'أفضل البائعين', slug: 'best-sellers', is_active: true, sort_order: 2 },
  { id: '3', name: 'جديد', name_ar: 'جديد', slug: 'new-arrivals', is_active: true, sort_order: 3 },
  { id: '4', name: 'خصومات', name_ar: 'خصومات', slug: 'discounts', is_active: true, sort_order: 4 },
  { id: '5', name: 'مميز', name_ar: 'مميز', slug: 'featured', is_active: true, sort_order: 5 }
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialQuery = params.q as string || '';
  const shouldFocus = params.focus === 'true';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Categories and highlights for navigation
  const [categories, setCategories] = useState<Category[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const categoriesScrollRef = useRef<ScrollView>(null);
  const highlightsScrollRef = useRef<ScrollView>(null);

  // Memoized values
  const displayCategories = useMemo(() => 
    categories.length > 0 ? categories : DEFAULT_CATEGORIES, 
    [categories]
  );
  
  const displayHighlights = useMemo(() => 
    highlights.length > 0 ? highlights : DEFAULT_HIGHLIGHTS, 
    [highlights]
  );

  // Fetch categories and highlights on mount
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await getCategories({ 
          page: 1, 
          limit: 20 
        }, abortController.signal);
        
        if (!isMounted || abortController.signal.aborted) return;
        
        let categoriesData: Category[] = [];
        if (categoriesResponse?.data?.data && Array.isArray(categoriesResponse.data.data)) {
          categoriesData = categoriesResponse.data.data;
        } else if (categoriesResponse?.data && Array.isArray(categoriesResponse.data)) {
          categoriesData = categoriesResponse.data;
        }
        
        if (categoriesData.length > 0) {
          setCategories(categoriesData);
        }
        
        // Fetch highlights
        const highlightsResponse = await getHighlights({ 
          page: 1, 
          limit: 20 
        }, abortController.signal);
        
        if (!isMounted || abortController.signal.aborted) return;
        
        let highlightsData: Highlight[] = [];
        if (highlightsResponse?.data?.data && Array.isArray(highlightsResponse.data.data)) {
          highlightsData = highlightsResponse.data.data;
        } else if (highlightsResponse?.data && Array.isArray(highlightsResponse.data)) {
          highlightsData = highlightsResponse.data;
        }
        
        if (highlightsData.length > 0) {
          setHighlights(highlightsData);
        }
        
      } catch (error: any) {
        if (error?.message === 'Aborted' || error?.name === 'AbortError') {
          return;
        }
        
        if (isMounted && !abortController.signal.aborted) {
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    // If there's an initial query, search immediately
    if (initialQuery) {
      searchProducts(initialQuery, 1, 20).then(response => {
        if (response.success && response.data && response.data.data) {
          setProducts(response.data.data);
          setHasSearched(true);
          setSearchQuery(initialQuery);
        }
      }).catch(error => {
      });
    }
  }, [initialQuery]);

  const handleSearch = useCallback(async (query: string, pageNum: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setProducts([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await searchProducts(query, pageNum, 20);
      
      if (response.success && response.data && response.data.data) {
        const newProducts = response.data.data;
        
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        
        setHasSearched(true);
        setHasMore(newProducts.length === 20);
        setPage(pageNum);
      } else {
        setError('فشل في البحث');
        setProducts([]);
      }
    } catch (error: any) {
      setError(error.message || 'حدث خطأ أثناء البحث');
      if (!append) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim());
    }
  }, [searchQuery, handleSearch]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && searchQuery.trim()) {
      handleSearch(searchQuery, page + 1, true);
    }
  }, [loadingMore, hasMore, searchQuery, page, handleSearch]);

  // Navigation handlers
  const handleCategoryPress = useCallback((categoryId: string) => {
    router.push(`/category/${categoryId}` as any);
  }, [router]);

  const handleHighlightPress = useCallback((highlightSlug: string) => {
    router.push(`/highlight/${highlightSlug}` as any);
  }, [router]);

  // Scroll handlers
  const handleCategoriesScrollLeft = useCallback(() => {
    categoriesScrollRef.current?.scrollTo({ 
      x: Math.max(0, (categoriesScrollRef.current as any)?._lastX - 140), 
      animated: true 
    });
  }, []);

  const handleCategoriesScrollRight = useCallback(() => {
    categoriesScrollRef.current?.scrollTo({ 
      x: ((categoriesScrollRef.current as any)?._lastX || 0) + 140, 
      animated: true 
    });
  }, []);

  const handleHighlightsScrollLeft = useCallback(() => {
    highlightsScrollRef.current?.scrollTo({ 
      x: Math.max(0, (highlightsScrollRef.current as any)?._lastX - 140), 
      animated: true 
    });
  }, []);

  const handleHighlightsScrollRight = useCallback(() => {
    highlightsScrollRef.current?.scrollTo({ 
      x: ((highlightsScrollRef.current as any)?._lastX || 0) + 140, 
      animated: true 
    });
  }, []);

  const handleCategoriesScrollUpdate = useCallback((event: any) => {
    (categoriesScrollRef.current as any)._lastX = event.nativeEvent.contentOffset.x;
  }, []);

  const handleHighlightsScrollUpdate = useCallback((event: any) => {
    (highlightsScrollRef.current as any)._lastX = event.nativeEvent.contentOffset.x;
  }, []);

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      variant="grid"
      onPress={() => router.push(`/product/${item.id}` as any)}
    />
  );

  // Render category item
  const renderCategoryItem = useCallback((category: Category) => {
    return (
      <TouchableOpacity
        key={category.id}
        style={styles.categoryItem}
        activeOpacity={0.85}
        onPress={() => handleCategoryPress(String(category.id))}
        accessible={true}
        accessibilityLabel={`فئة: ${category.name_ar || category.name}`}
        accessibilityRole="button"
      >
        <View style={styles.categoryCard}>
          {category.image ? (
            <Image 
              source={{ 
                uri: (category.image && typeof category.image === 'string' && category.image.trim()) 
                  ? category.image 
                  : 'https://placehold.co/600x400.png'
              }} 
              style={styles.categoryImage} 
            />
          ) : (
            <FontAwesome6 
              name="book" 
              size={24} 
              color={BRAND_COLORS.text.primary} 
            />
          )}
          <Text 
            style={styles.categoryLabel} 
            numberOfLines={2}
          >
            {category.name_ar || category.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleCategoryPress]);

  // Render highlight item
  const renderHighlightItem = useCallback((highlight: Highlight) => {
    return (
      <TouchableOpacity
        key={highlight.id}
        style={styles.categoryItem}
        activeOpacity={0.85}
        onPress={() => handleHighlightPress(highlight.slug)}
        accessible={true}
        accessibilityLabel={`تسليط الضوء: ${highlight.name_ar || highlight.name}`}
        accessibilityRole="button"
      >
        <View style={styles.categoryCard}>
          {highlight.image ? (
            <Image 
              source={{ 
                uri: (highlight.image && typeof highlight.image === 'string' && highlight.image.trim()) 
                  ? highlight.image 
                  : 'https://placehold.co/600x400.png'
              }} 
              style={styles.categoryImage} 
            />
          ) : (
            <FontAwesome6 
              name="star" 
              size={24} 
              color={BRAND_COLORS.text.primary} 
            />
          )}
          <Text 
            style={styles.categoryLabel} 
            numberOfLines={2}
          >
            {highlight.name_ar || highlight.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [handleHighlightPress]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
        <Text style={styles.loadingText}>جاري تحميل المزيد...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search" size={64} color={BRAND_COLORS.text.tertiary} />
          <Text style={styles.emptyTitle}>ابحث عن المنتجات</Text>
          <Text style={styles.emptySubtitle}>اكتب اسم المنتج أو الوصف للبحث</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="error-outline" size={64} color={BRAND_COLORS.error} />
          <Text style={styles.emptyTitle}>خطأ في البحث</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => handleSearch(searchQuery)}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="search-off" size={64} color={BRAND_COLORS.text.tertiary} />
        <Text style={styles.emptyTitle}>لا توجد نتائج</Text>
        <Text style={styles.emptySubtitle}>جرب كلمات بحث مختلفة</Text>
      </View>
    );
  };

  return (
    <SafeAreaWrapper backgroundColor={BRAND_COLORS.background.primary}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن المنتجات..."
            placeholderTextColor={BRAND_COLORS.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus={shouldFocus}
            textAlign="right"
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearchSubmit}
            activeOpacity={0.7}
          >
            <MaterialIcons name="search" size={20} color={BRAND_COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>



      {/* Search Results */}
      {hasSearched && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>نتائج البحث</Text>
            <MaterialIcons name="search" size={18} color={BRAND_COLORS.primary}/>
          </View>
        </View>
      )}

      {/* Content */}
      {loading && !hasSearched ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
          <Text style={styles.loadingText}>جاري البحث...</Text>
        </View>
      ) : hasSearched ? (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search" size={64} color={BRAND_COLORS.text.tertiary} />
          <Text style={styles.emptyTitle}>ابحث عن المنتجات</Text>
          <Text style={styles.emptySubtitle}>اكتب اسم المنتج أو الوصف للبحث</Text>
        </View>
      )}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BRAND_COLORS.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.background.secondary,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${BRAND_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.tertiary,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  row: {
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 25,
    marginTop: SPACING.md,
  },
  retryButtonText: {
    color: BRAND_COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    justifyContent: 'flex-end' as const,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'right' as const,
  },
  categoriesContainer: {
    position: 'relative',
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  categoriesRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  categoriesArrow: {
    width: 28,
    height: 60,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoriesScrollContent: {
    paddingHorizontal: SPACING.sm,
    gap: SPACING.sm,
    alignItems: 'center' as const,
  },
  categoriesBaseline: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    bottom: 0,
    height: 2,
    backgroundColor: BRAND_COLORS.primary,
  },
  categoryItem: {
    alignItems: 'center' as const,
    marginHorizontal: SPACING.sm,
  },
  categoryCard: {
    backgroundColor: 'transparent',
    width: 90,
    height: 88,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: SPACING.sm,
  },
  categoryLabel: {
    textAlign: 'center' as const,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: BRAND_COLORS.text.primary,
    lineHeight: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginTop: 4,
  },
  categoryImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
});