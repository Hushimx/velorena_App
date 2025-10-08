import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import DesignBottomSheet from '../components/ui/DesignBottomSheet';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useHasHydrated, useIsAuthenticated } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { deleteDesignFromCart, Design, getCartDesigns, saveDesignToCart, searchDesigns } from '../utils/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface DesignCardProps {
  design: Design;
  onPress: (design: Design) => void;
}

const DesignCard = ({ design, onPress }: DesignCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <View style={[styles.cardContainer, { width: CARD_WIDTH }]}>
      <TouchableOpacity 
        style={styles.card}
        onPress={() => onPress(design)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          {!imageLoaded && !imageError && (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
            </View>
          )}
          
          {imageError ? (
            <View style={styles.imageError}>
              <FontAwesome6 name="image" size={32} color="#9CA3AF" />
            </View>
          ) : (
            <Image
              source={{ uri: design.image_url }}
              style={[styles.cardImage, { opacity: imageLoaded ? 1 : 0 }]}
              resizeMode="cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
            />
          )}
          
          {/* Cart Status Indicator */}
          {design.in_cart && (
            <View style={styles.cartIndicator}>
              <MaterialIcons name="shopping-cart" size={16} color="white" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};


export default function DesignsScreen() {
  const router = useRouter();
  const addDesign = useCartStore((s) => s.addDesign);
  const isAuthenticated = useIsAuthenticated();
  const hasHydrated = useHasHydrated();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cartDesigns, setCartDesigns] = useState<Set<string>>(new Set());
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [bottomSheetLoading, setBottomSheetLoading] = useState(false);
  
  // Bottom sheet ref
  const bottomSheetRef = useRef<BottomSheetModal | null>(null);

  // Load cart designs on component mount
  const loadCartDesigns = useCallback(async () => {
    if (!isAuthenticated) {
      setCartDesigns(new Set());
      return;
    }

    try {
      const response = await getCartDesigns();
      if (response.success && response.data && Array.isArray(response.data)) {
        const cartDesignIds = new Set<string>(response.data.map((item: any) => item.design_data?.original_design_id || item.id));
        setCartDesigns(cartDesignIds);
      } else {
        setCartDesigns(new Set());
      }
    } catch (error) {
      setCartDesigns(new Set());
    }
  }, [isAuthenticated]);

  // Load cart designs when component mounts
  React.useEffect(() => {
    loadCartDesigns();
  }, [loadCartDesigns]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال تفاصيل التصميم');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await searchDesigns(searchQuery);
      
      if (response.success && response.data) {
        // Handle both array and paginated response formats
        const designsData = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        const apiDesigns = designsData.map((item: any, index: number) => ({
          id: item.id || `api-${index}`,
          title: item.title || item.name || 'تصميم من API',
          description: item.description || item.prompt || '',
          image_url: item.image_url || item.url || item.image || item.thumbnail_url || '',
          thumbnail_url: item.thumbnail_url || item.image_url || item.url || item.image || '',
          category: item.category || 'api',
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? item.tags.split(',') : []),
          in_cart: item.in_cart || cartDesigns.has(item.id || `api-${index}`),
          metadata: item.metadata || {},
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        }));
        setDesigns(apiDesigns);
      } else {
        // No designs found from API
        setDesigns([]);
      }
    } catch (error) {
      // Show empty state on error
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, cartDesigns]);

  const handleDesignPress = (design: Design) => {
    setSelectedDesign(design);
    bottomSheetRef.current?.present();
  };

  const handleDesignSave = async (design: Design) => {
    if (!isAuthenticated) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'يجب تسجيل الدخول لحفظ التصاميم في السلة',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل الدخول', onPress: () => router.push('/login') }
        ]
      );
      return;
    }

    setBottomSheetLoading(true);
    try {
      // Save to cart using new API
      const response = await saveDesignToCart({
        design_id: design.id,
        title: design.title,
        image_url: design.image_url
      });

      if (response.success) {
        // Update design status in local state
        setDesigns(prev => prev.map(d => 
          d.id === design.id ? { ...d, in_cart: true } : d
        ));

        // Update cart designs set
        setCartDesigns(prev => new Set([...prev, design.id]));

        // Add to cart store for local state management
        addDesign(design);

        // Reload cart designs to get fresh data
        await loadCartDesigns();

        Alert.alert(
          'تم الحفظ', 
          response.message || 'تم حفظ التصميم في السلة بنجاح!',
          [
            { text: 'موافق', style: 'default' }
          ]
        );
      } else {
        Alert.alert('خطأ', response.message || 'فشل في حفظ التصميم');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ التصميم. حاول مرة أخرى');
    } finally {
      setBottomSheetLoading(false);
    }
  };

  const handleDesignRemove = async (design: Design) => {
    if (!isAuthenticated) {
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'يجب تسجيل الدخول لإدارة السلة',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل الدخول', onPress: () => router.push('/login') }
        ]
      );
      return;
    }

    setBottomSheetLoading(true);
    try {
      // Remove from cart using new API
      const response = await deleteDesignFromCart({
        design_id: design.id,
        title: design.title,
        image_url: design.image_url
      });

      if (response.success) {
        // Update design status in local state
        setDesigns(prev => prev.map(d => 
          d.id === design.id ? { ...d, in_cart: false } : d
        ));

        // Update cart designs set
        setCartDesigns(prev => {
          const newSet = new Set(prev);
          newSet.delete(design.id);
          return newSet;
        });

        // Reload cart designs to get fresh data
        await loadCartDesigns();

        Alert.alert(
          'تم الحذف', 
          response.message || 'تم حذف التصميم من السلة بنجاح!',
          [
            { text: 'موافق', style: 'default' }
          ]
        );
      } else {
        Alert.alert('خطأ', response.message || 'فشل في حذف التصميم');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حذف التصميم. حاول مرة أخرى');
    } finally {
      setBottomSheetLoading(false);
    }
  };

  const renderDesignItem = ({ item }: { item: Design }) => (
    <DesignCard 
      design={item} 
      onPress={handleDesignPress}
    />
  );

  // Show loading state while waiting for auth hydration
  if (!hasHydrated) {
    return (
      <SafeAreaWrapper backgroundColor="#FFFFFF">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>مكتبة التصاميم</Text>
            <Text style={styles.headerSubtitle}>جاري التحميل...</Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      {/* Minimal Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>مكتبة التصاميم</Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>

        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color={BRAND_COLORS.primary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="اكتب تفاصيل التصميم"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <MaterialIcons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Results */}
      {hasSearched && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>النتائج</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
              <Text style={styles.loadingText}>جاري البحث في التصاميم...</Text>
            </View>
          ) : designs.length > 0 ? (
            <FlatList
              data={designs}
              renderItem={renderDesignItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.flatListRow}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="image-not-supported" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>لم يتم العثور على تصاميم</Text>
              <Text style={styles.emptySubtitle}>جرب البحث بكلمات مختلفة</Text>
            </View>
          )}
        </View>
      )}

      {/* Authentication Prompt for Unauthenticated Users */}
      {!isAuthenticated && (
        <View style={styles.authPrompt}>
          <View style={styles.authIcon}>
            <MaterialIcons name="lock" size={48} color={BRAND_COLORS.primary} />
          </View>
          <Text style={styles.authTitle}>تسجيل الدخول مطلوب</Text>
          <Text style={styles.authSubtitle}>
            يجب تسجيل الدخول لحفظ التصاميم في السلة والاستفادة من جميع الميزات
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="login" size={20} color="white" />
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Initial State for Authenticated Users */}
      {!hasSearched && isAuthenticated && (
        <View style={styles.initialState}>
          <View style={styles.initialIcon}>
            <MaterialIcons name="palette" size={64} color={BRAND_COLORS.primary} />
          </View>
          <Text style={styles.initialTitle}>ابدأ البحث عن التصاميم</Text>
          <Text style={styles.initialSubtitle}>
            اكتب وصفاً للتصميم الذي تريده وسنساعدك في العثور على أفضل الأفكار الإبداعية
          </Text>
        </View>
      )}

      {/* Bottom Sheet for Design Details */}
      <DesignBottomSheet
        bottomSheetRef={bottomSheetRef}
        design={selectedDesign}
        onAddToCart={handleDesignSave}
        onRemoveFromCart={handleDesignRemove}
        loading={bottomSheetLoading}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerSubtitle: {
    fontSize: 14,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  headerSpacer: {
    width: 40,
  },
  searchSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchTitleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    borderRadius: 20,
    backgroundColor: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  searchDescription: {
    fontSize: 14,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  searchContainer: {
    alignItems: 'center',
  },
  searchInputContainer: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginLeft: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
    paddingVertical: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
    marginBottom: SPACING.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: BRAND_COLORS.text.secondary,
    fontSize: 18,
    marginTop: SPACING.xl,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'center',
    lineHeight: 24,
  },
  flatListRow: {
    justifyContent: 'space-between',
  },
  flatListContent: {
    paddingBottom: SPACING.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    color: BRAND_COLORS.text.primary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: SPACING.xl,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    lineHeight: 28,
  },
  emptySubtitle: {
    color: BRAND_COLORS.text.secondary,
    fontSize: 16,
    marginTop: SPACING.md,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    maxWidth: 280,
  },
  initialState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 80,
  },
  initialIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 3,
    borderColor: BRAND_COLORS.primary,
  },
  initialTitle: {
    color: BRAND_COLORS.text.primary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: SPACING.lg,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  initialSubtitle: {
    color: BRAND_COLORS.text.secondary,
    fontSize: 16,
    marginTop: SPACING.lg,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  cardContainer: {
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  imageContainer: {
    position: 'relative',
    height: 240,
    backgroundColor: '#f8fafc',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  imageError: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  cartIndicator: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 60,
  },
  authIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 3,
    borderColor: BRAND_COLORS.primary,
  },
  authTitle: {
    color: BRAND_COLORS.text.primary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.lg,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  authSubtitle: {
    color: BRAND_COLORS.text.secondary,
    fontSize: 16,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  loginButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: 28,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: SPACING.sm,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
});