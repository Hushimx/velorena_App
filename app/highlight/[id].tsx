import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ProductCard from '../../components/ProductCard';
import { ErrorState, SectionError } from '../../components/ErrorState';
import { LoadingSpinner, SectionLoading } from '../../components/LoadingSpinner';
import { getHighlightProducts, getHighlights } from '../../utils/api';

// Constants
const BROWN_DARK = '#2a1e1e';
const YELLOW = '#ffde9f';
const GRAY = '#9CA3AF';

// TypeScript Interfaces
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

interface ApiResponse<T> {
  data?: T | T[];
  success?: boolean;
  message?: string;
}

// Default fallback highlights
const DEFAULT_HIGHLIGHTS: Highlight[] = [
  { id: '1', name: 'عروض الربيع', name_ar: 'عروض الربيع', slug: 'spring-offers', is_active: true, sort_order: 1 },
  { id: '2', name: 'أفضل البائعين', name_ar: 'أفضل البائعين', slug: 'best-sellers', is_active: true, sort_order: 2 },
  { id: '3', name: 'جديد', name_ar: 'جديد', slug: 'new-arrivals', is_active: true, sort_order: 3 },
  { id: '4', name: 'خصومات', name_ar: 'خصومات', slug: 'discounts', is_active: true, sort_order: 4 },
  { id: '5', name: 'مميز', name_ar: 'مميز', slug: 'featured', is_active: true, sort_order: 5 }
];

export default function HighlightScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [currentHighlight, setCurrentHighlight] = useState<Highlight | null>(null);
  const [search, setSearch] = useState('');
  const highlightsScrollRef = useRef<ScrollView>(null);

  // Memoized values
  const displayHighlights = useMemo(() => 
    highlights.length > 0 ? highlights : DEFAULT_HIGHLIGHTS, 
    [highlights]
  );
  
  const activeHighlight = useMemo(() => 
    displayHighlights.find(h => String(h.id) === String(activeHighlightId)),
    [displayHighlights, activeHighlightId]
  );

  const sectionTitle = useMemo(() => {
    if (search) return 'نتائج البحث';
    return currentHighlight?.name_ar || currentHighlight?.name || activeHighlight?.name_ar || activeHighlight?.name || 'أحدث التصميمات';
  }, [search, currentHighlight, activeHighlight]);

  // Load initial highlight id
  useEffect(() => {
    if (id) {
      setActiveHighlightId(String(id));
    }
  }, [id]);

  // Fetch highlights
  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchHighlights = async () => {
      try {
        setHighlightsLoading(true);
        const response = await getHighlights({ 
          page: 1, 
          limit: 20, 
          search 
        }, abortController.signal);
        
        if (!isMounted || abortController.signal.aborted) return;
        
        console.log('📚 Highlights response:', response);
        
        // Handle different response structures
        let highlightsData: Highlight[] = [];
        if (response?.data?.data && Array.isArray(response.data.data)) {
          highlightsData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          highlightsData = response.data;
        }
        
        if (highlightsData.length > 0) {
          setHighlights(highlightsData);
        }
      } catch (error: any) {
        if (error?.message === 'Aborted' || error?.name === 'AbortError') {
          console.log('🔄 Highlights request was aborted');
          return;
        }
        
        if (isMounted && !abortController.signal.aborted) {
          console.error('❌ Failed to fetch highlights:', error);
          // Keep existing highlights on error
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setHighlightsLoading(false);
        }
      }
    };

    fetchHighlights();
    
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [search]);

  // Fetch products by highlight
  useEffect(() => {
    if (!activeHighlightId && !id) return;
    
    const abortController = new AbortController();
    let isMounted = true;
    
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const highlightId = String(activeHighlightId || id);
        console.log('🔄 Fetching products for highlight:', highlightId, 'search:', search);
        
        const response = await getHighlightProducts(highlightId, { 
          page: 1, 
          limit: 50,
          search
        }, abortController.signal);
        
        if (!isMounted || abortController.signal.aborted) return;
        
        console.log('📦 Highlight products response:', response);
        
        // Handle different response structures
        let products: Product[] = [];
        if (response?.data?.data) {
          products = response.data.data;
        } else if (response?.data) {
          products = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          products = response;
        }
        
        // Set current highlight info if available
        if (response?.highlight) {
          setCurrentHighlight(response.highlight);
        }
        
        console.log(`✅ Loaded ${products.length} products for highlight ${highlightId}`);
        setItems(products);
        
      } catch (error: any) {
        if (error?.message === 'Aborted' || error?.name === 'AbortError') {
          console.log('🔄 Request was aborted');
          return;
        }
        
        if (isMounted && !abortController.signal.aborted) {
          console.error('❌ Failed to fetch products:', error);
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
  }, [id, activeHighlightId, search]);

  // Memoized handlers
  const handleHighlightPress = useCallback((highlightId: string) => {
    setActiveHighlightId(highlightId);
  }, []);

  const handleProductPress = useCallback((productId: string) => {
    router.push(`/product/${productId}` as any);
  }, [router]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
  }, []);

  const handleScrollLeft = useCallback(() => {
    highlightsScrollRef.current?.scrollTo({ 
      x: Math.max(0, (highlightsScrollRef.current as any)?._lastX - 140), 
      animated: true 
    });
  }, []);

  const handleScrollRight = useCallback(() => {
    highlightsScrollRef.current?.scrollTo({ 
      x: ((highlightsScrollRef.current as any)?._lastX || 0) + 140, 
      animated: true 
    });
  }, []);

  const handleScrollUpdate = useCallback((event: any) => {
    (highlightsScrollRef.current as any)._lastX = event.nativeEvent.contentOffset.x;
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

  const renderHighlightItem = useCallback((highlight: Highlight) => {
    const isActive = String(activeHighlightId) === String(highlight.id);
    
    return (
      <TouchableOpacity
        key={highlight.id}
        style={styles.categoryItem}
        activeOpacity={0.85}
        onPress={() => handleHighlightPress(String(highlight.id))}
        accessible={true}
        accessibilityLabel={`تسليط الضوء: ${highlight.name_ar || highlight.name}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <View style={styles.categoryCard}>
          {highlight.image ? (
            <Image 
              source={{ uri: highlight.image }} 
              style={[
                styles.categoryImage, 
                { opacity: isActive ? 1 : 0.6 }
              ]} 
            />
          ) : (
            <FontAwesome6 
              name="star" 
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
            {highlight.name_ar || highlight.name}
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
  }, [activeHighlightId, handleHighlightPress]);

  // Loading state
  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingSpinner 
          fullScreen 
          text="جاري تحميل العناصر…" 
          color={BROWN_DARK}
        />
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

      {/* Highlights bar */}
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
            ref={highlightsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
            onScroll={handleScrollUpdate}
            scrollEventThrottle={16}
            accessible={true}
            accessibilityLabel="قائمة التسليطات"
          >
            {displayHighlights.map(renderHighlightItem)}
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
        <ErrorState
          title="حدث خطأ"
          message={error}
          onRetry={handleRetry}
          retryText="إعادة المحاولة"
          style={styles.errorContainer}
        />
      ) : items.length === 0 ? (
        <View style={styles.center}> 
          <Text style={styles.centerText}>
            {search ? 'لا توجد نتائج للبحث' : 'لا توجد عناصر في هذا التسليط'}
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
  errorContainer: {
    flex: 1,
    padding: 20,
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
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 8,
  },
});
