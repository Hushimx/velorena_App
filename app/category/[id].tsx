import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ProductCard from '../../components/ProductCard';
import { getCategories, getProducts } from '../../utils/api';

// Constants
const BROWN_DARK = '#2a1e1e';
const YELLOW = '#ffde9f';
const GRAY = '#9CA3AF';

// TypeScript Interfaces
interface Category {
  id: string;
  name: string;
  name_ar: string;
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
}

interface ApiResponse<T> {
  data?: T | T[];
  success?: boolean;
  message?: string;
}

// Default fallback categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'كتالوجات', name_ar: 'كتالوجات' },
  { id: '2', name: 'التغليف', name_ar: 'التغليف' },
  { id: '3', name: 'كراسات', name_ar: 'كراسات' },
  { id: '4', name: 'فلاير', name_ar: 'فلاير' },
  { id: '5', name: 'هدايا', name_ar: 'هدايا' }
];

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const categoriesScrollRef = useRef<ScrollView>(null);

  // Memoized values
  const displayCategories = useMemo(() => 
    categories.length > 0 ? categories : DEFAULT_CATEGORIES, 
    [categories]
  );
  
  const activeCategory = useMemo(() => 
    displayCategories.find(c => String(c.id) === String(activeCategoryId)),
    [displayCategories, activeCategoryId]
  );

  const sectionTitle = useMemo(() => {
    if (search) return 'نتائج البحث';
    return activeCategory?.name_ar || activeCategory?.name || 'أحدث التصميمات';
  }, [search, activeCategory]);

  // Load initial category id
  useEffect(() => {
    if (id) {
      setActiveCategoryId(String(id));
    }
  }, [id]);

  // Fetch categories
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await getCategories({ 
          page: 1, 
          limit: 20, 
          search 
        }, abortController.signal);
        
        if (!isMounted || abortController.signal.aborted) return;
        
        
        // Handle different response structures
        let categoriesData: Category[] = [];
        if (response?.data?.data && Array.isArray(response.data.data)) {
          categoriesData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          categoriesData = response.data;
        }
        
        if (categoriesData.length > 0) {
          setCategories(categoriesData);
        }
      } catch (error: any) {
        if (error?.message === 'Aborted' || error?.name === 'AbortError') {
          return;
        }
        
        if (isMounted && !abortController.signal.aborted) {
          // Keep existing categories on error
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setCategoriesLoading(false);
        }
      }
    };

    fetchCategories();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [search]);

  // Fetch products by category
  useEffect(() => {
    if (!activeCategoryId && !id) return;
    
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const categoryId = String(activeCategoryId || id);
        
        const response = await getProducts({ 
          page: 1, 
          limit: 50,
          search, 
          category_id: categoryId 
        }, abortController.signal);
        
        if (!isMounted || abortController.signal.aborted) return;
        
        
        // Handle different response structures
        let products: Product[] = [];
        if (response?.data?.data) {
          products = response.data.data;
        } else if (response?.data) {
          products = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          products = response;
        }
        
        setItems(products);
        
      } catch (error: any) {
        if (error?.message === 'Aborted' || error?.name === 'AbortError') {
          return;
        }
        
        if (isMounted && !abortController.signal.aborted) {
          setError(error?.message || 'فشل تحميل العناصر');
          setItems([]);
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [id, activeCategoryId, search]);

  // Memoized handlers
  const handleCategoryPress = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
  }, []);

  const handleProductPress = useCallback((productId: string) => {
    router.push(`/product/${productId}` as any);
  }, [router]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
  }, []);

  const handleScrollLeft = useCallback(() => {
    categoriesScrollRef.current?.scrollTo({ 
      x: Math.max(0, (categoriesScrollRef.current as any)?._lastX - 140), 
      animated: true 
    });
  }, []);

  const handleScrollRight = useCallback(() => {
    categoriesScrollRef.current?.scrollTo({ 
      x: ((categoriesScrollRef.current as any)?._lastX || 0) + 140, 
      animated: true 
    });
  }, []);

  const handleScrollUpdate = useCallback((event: any) => {
    (categoriesScrollRef.current as any)._lastX = event.nativeEvent.contentOffset.x;
  }, []);

  // Memoized render functions
  const renderProductItem = useCallback(({ item }: { item: Product }) => {
    return (
      <ProductCard
        product={item}
        variant="grid"
        onPress={() => handleProductPress(String(item.id))}
      />
    );
  }, [handleProductPress]);

  const renderCategoryItem = useCallback((category: Category) => {
    const isActive = String(activeCategoryId) === String(category.id);
    
    return (
      <TouchableOpacity
        key={category.id}
        style={styles.categoryItem}
        activeOpacity={0.85}
        onPress={() => handleCategoryPress(String(category.id))}
        accessible={true}
        accessibilityLabel={`فئة: ${category.name_ar || category.name}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <View style={styles.categoryCard}>
          {category.image ? (
            <Image 
              source={{ uri: category.image }} 
              style={[
                styles.categoryImage, 
                { opacity: isActive ? 1 : 0.6 }
              ]} 
            />
          ) : (
            <FontAwesome6 
              name="book" 
              size={24} 
              color={isActive ? BROWN_DARK : GRAY} 
            />
          )}
          <Text 
            style={[
              styles.categoryLabel, 
              { color: isActive ? BROWN_DARK : GRAY }
            ]} 
            numberOfLines={2}
          >
            {category.name_ar || category.name}
          </Text>
          <View 
            style={[
              styles.categoryUnderline, 
              { backgroundColor: isActive ? BROWN_DARK : 'transparent' }
            ]} 
          />
        </View>
      </TouchableOpacity>
    );
  }, [activeCategoryId, handleCategoryPress]);

  // Loading state
  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}> 
          <ActivityIndicator color={BROWN_DARK} size="large" />
          <Text style={styles.centerText}>جاري تحميل العناصر…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.back()}
          accessible={true}
          accessibilityLabel="العودة"
          accessibilityRole="button"
        >
          <MaterialIcons name="chevron-left" size={22} color={BROWN_DARK} />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <TextInput 
            value={search} 
            onChangeText={setSearch} 
            placeholder="ابحث" 
            placeholderTextColor={GRAY} 
            style={styles.headerSearchInput} 
            textAlign="right"
            accessible={true}
            accessibilityLabel="حقل البحث"
            accessibilityRole="search"
          />
          <MaterialIcons 
            name="search" 
            size={20} 
            color={GRAY} 
            style={styles.headerSearchIcon} 
          />
        </View>
        
        <TouchableOpacity 
          style={styles.cartBtn}
          accessible={true}
          accessibilityLabel="سلة التسوق"
          accessibilityRole="button"
        >
          <MaterialIcons name="shopping-cart" size={24} color={BROWN_DARK} />
        </TouchableOpacity>
      </View>

      {/* Categories bar */}
      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesRow}>
          <TouchableOpacity
            style={styles.categoriesArrow}
            activeOpacity={0.7}
            onPress={handleScrollLeft}
            accessible={true}
            accessibilityLabel="تمرير للخلف"
            accessibilityRole="button"
          >
            <MaterialIcons name="chevron-left" size={20} color={BROWN_DARK} />
          </TouchableOpacity>
          
          <ScrollView
            ref={categoriesScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
            onScroll={handleScrollUpdate}
            scrollEventThrottle={16}
            accessible={true}
            accessibilityLabel="قائمة الفئات"
          >
            {displayCategories.map(renderCategoryItem)}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.categoriesArrow}
            activeOpacity={0.7}
            onPress={handleScrollRight}
            accessible={true}
            accessibilityLabel="تمرير للأمام"
            accessibilityRole="button"
          >
            <MaterialIcons name="chevron-right" size={20} color={BROWN_DARK} />
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesBaseline} />
      </View>

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <MaterialIcons name="collections-bookmark" size={18} color={BROWN_DARK}/>
      </View>

      {/* Content */}
      {error ? (
        <View style={styles.center}> 
          <Text style={[styles.centerText, { color: '#b91c1c' }]}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleRetry}
            accessible={true}
            accessibilityLabel="إعادة المحاولة"
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}> 
          <Text style={styles.centerText}>
            {search ? 'لا توجد نتائج للبحث' : 'لا توجد عناصر في هذه الفئة'}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={items}
          numColumns={2}
          keyExtractor={(item) => String(item.id)}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={renderProductItem}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={6}
          getItemLayout={(data, index) => ({
            length: 200,
            offset: 200 * Math.floor(index / 2),
            index,
          })}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 35,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchContainer: {
    flex: 1,
    marginHorizontal: 8,
    position: 'relative',
  },
  headerSearchInput: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: BROWN_DARK,
    color: BROWN_DARK,
    fontSize: 14,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  headerSearchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -10,
  },
  cartBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  centerText: {
    color: BROWN_DARK,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: 'flex-end',
  },
  sectionTitle: {
    fontSize: 14,
    color: BROWN_DARK,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    textAlign: 'right',
  },
  categoriesContainer: {
    position: 'relative',
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoriesArrow: {
    width: 28,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesScrollContent: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: 'center',
  },
  categoriesBaseline: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 0,
    height: 2,
    backgroundColor: '#D1D5DB',
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  categoryCard: {
    backgroundColor: 'transparent',
    width: 90,
    height: 88,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  categoryLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: BROWN_DARK,
    lineHeight: 14,
    fontFamily: 'NotoSansArabic_500Medium',
    marginTop: 4,
  },
  categoryUnderline: {
    position: 'absolute',
    bottom: -8,
    width: 44,
    height: 3,
    borderRadius: 2,
  },
  categoryImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: BROWN_DARK,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 8,
  },
});
