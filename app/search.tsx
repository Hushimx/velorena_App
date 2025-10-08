import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import ProductCard from '../components/ProductCard';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { searchProducts } from '../utils/api';

// TypeScript Interfaces
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

  const handleSearch = useCallback(async (query: string, pageNum: number = 1, append: boolean = false) => {
    if (!query.trim()) {
      setProducts([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    // Minimum 2 characters required for search
    if (query.trim().length < 2) {
      setError('يرجى إدخال حرفين على الأقل للبحث');
      return;
    }

    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      console.log('🔍 Searching for:', query, 'Page:', pageNum);
      const response = await searchProducts(query.trim(), pageNum, 20);
      console.log('📦 Search response:', response);
      
      // The API returns { success: true, data: { data: [...], ... } }
      if (response && response.success && response.data) {
        let newProducts = [];
        
        // Handle both response formats
        if (Array.isArray(response.data.data)) {
          newProducts = response.data.data;
        } else if (Array.isArray(response.data)) {
          newProducts = response.data;
        }
        
        console.log('✅ Found products:', newProducts.length);
        
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        
        setHasSearched(true);
        setHasMore(newProducts.length === 20);
        setPage(pageNum);
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setError('لم يتم العثور على نتائج');
        if (!append) {
          setProducts([]);
        }
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      const errorMessage = error.message || 'حدث خطأ أثناء البحث';
      setError(errorMessage);
      if (!append) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    // If there's an initial query, search immediately
    if (initialQuery && initialQuery.trim().length >= 2) {
      handleSearch(initialQuery.trim());
    }
  }, [initialQuery, handleSearch]);

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

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      variant="grid"
      onPress={() => router.push(`/product/${item.id}` as any)}
    />
  );

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