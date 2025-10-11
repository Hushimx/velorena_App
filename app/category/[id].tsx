import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProductCard from '../../components/ProductCard';
import { getCategories, getProducts } from '../../utils/api';

// Constants
const BROWN_DARK = '#2a1e1e';

// TypeScript Interfaces
interface Product {
  id: string;
  name: string;
  name_ar: string;
  base_price?: number;
  image?: string;
  main_image?: string;
  images?: string[];
}

export default function CategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState<string>('المنتجات');

  // Load initial category id and fetch category name
  useEffect(() => {
    if (id) {
      setActiveCategoryId(String(id));
      // Fetch category name
      const fetchCategoryName = async () => {
        try {
          const response = await getCategories({ page: 1, limit: 100 });
          const categoriesData = response?.data?.data || response?.data || [];
          const category = categoriesData.find((cat: any) => String(cat.id) === String(id));
          if (category) {
            setCategoryName(category.name_ar || category.name || 'المنتجات');
          }
        } catch (error) {
          console.log('Error fetching category name:', error);
        }
      };
      fetchCategoryName();
    }
  }, [id]);

  // Fetch products by category
  useEffect(() => {
    if (!activeCategoryId && !id) return;
    
    // Clear items immediately when category changes to prevent showing old products
    setItems([]);
    
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
  }, [id, activeCategoryId]);

  // Memoized handlers
  const handleProductPress = useCallback((productId: string) => {
    router.push(`/product/${productId}` as any);
  }, [router]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
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
          <MaterialIcons name="arrow-forward" size={26} color={BROWN_DARK} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitleText}>{categoryName}</Text>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {loading && items.length === 0 ? (
        <View style={styles.center}> 
          <ActivityIndicator color={BROWN_DARK} size="large" />
          <Text style={styles.centerText}>جاري تحميل العناصر…</Text>
        </View>
      ) : error ? (
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
            لا توجد عناصر في هذه الفئة
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
    backgroundColor: '#fafafa',
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    flex: 1,
    fontSize: 22,
    color: BROWN_DARK,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
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
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 16,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: BROWN_DARK,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: BROWN_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 16,
  },
});
