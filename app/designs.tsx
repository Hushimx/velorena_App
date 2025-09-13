import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useCartStore } from '../store/useCartStore';
import { Design, saveDesign, searchDesigns } from '../utils/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface DesignCardProps {
  design: Design;
  onSelect: (design: Design) => void;
  onEdit: (design: Design) => void;
  onSave: (design: Design) => void;
}

const DesignCard = ({ design, onSelect, onEdit, onSave }: DesignCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <View style={[styles.cardContainer, { width: CARD_WIDTH }]}>
      <TouchableOpacity 
        style={styles.card}
        onPress={() => onEdit(design)}
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
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.designTitle} numberOfLines={1}>
            {design.title}
          </Text>
          {design.description && (
            <Text style={styles.designDescription} numberOfLines={2}>
              {design.description}
            </Text>
          )}
        </View>
        
        <View style={styles.cardOverlay}>
          <TouchableOpacity 
            onPress={() => onEdit(design)}
            style={styles.editButton}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={16} color="white" />
            <Text style={styles.editButtonText}>تعديل</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => onSave(design)}
            style={styles.saveButton}
            activeOpacity={0.8}
          >
            <MaterialIcons name="bookmark" size={16} color="white" />
            <Text style={styles.saveButtonText}>حفظ</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Mock designs for testing
const mockDesigns: Design[] = [
  {
    id: '1',
    title: 'بطاقة أعمال أنيقة',
    description: 'تصميم احترافي لبطاقات الأعمال',
    image_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&q=80',
    category: 'business',
    tags: ['بطاقة أعمال', 'احترافي'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    title: 'فلاير دعائي',
    description: 'تصميم جذاب للفلايرات الدعائية',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&q=80',
    category: 'flyer',
    tags: ['فلاير', 'دعائي'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '3',
    title: 'شعار شركة',
    description: 'تصميم شعار عصري للشركات',
    image_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&q=80',
    category: 'logo',
    tags: ['شعار', 'شركة'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '4',
    title: 'بوستر إعلاني',
    description: 'تصميم بوستر جذاب للإعلانات',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&q=80',
    category: 'poster',
    tags: ['بوستر', 'إعلان'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
];

export default function DesignsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addDesign = useCartStore((s) => s.addDesign);
  const [searchQuery, setSearchQuery] = useState('');
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
          category: item.category || 'api',
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? item.tags.split(',') : []),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString()
        }));
        setDesigns(apiDesigns);
      } else {
        // Fallback to mock data if API fails
        const filteredDesigns = mockDesigns.filter(design => 
          design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          design.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          design.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setDesigns(filteredDesigns.length > 0 ? filteredDesigns : mockDesigns);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to mock data on error
      const filteredDesigns = mockDesigns.filter(design => 
        design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setDesigns(filteredDesigns.length > 0 ? filteredDesigns : mockDesigns);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleDesignEdit = (design: Design) => {
    try {
      const params = { 
        designId: design.id, 
        designImage: design.image_url,
        designTitle: design.title,
        designDescription: design.description || ''
      };
      
      router.push({
        pathname: '/photo-editor',
        params: params
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء الانتقال إلى محرر الصور');
    }
  };

  const handleDesignSave = async (design: Design) => {
    try {
      // Save to API first
      await saveDesign({
        design_id: design.id,
        notes: `تصميم محفوظ: ${design.title}`
      });

      // Add to cart store
      addDesign(design);

      Alert.alert(
        'تم الحفظ', 
        'تم حفظ التصميم في السلة بنجاح!',
        [
          { text: 'موافق', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('خطأ', 'فشل في حفظ التصميم. حاول مرة أخرى');
    }
  };

  const renderDesignItem = ({ item }: { item: Design }) => (
    <DesignCard 
      design={item} 
      onSelect={handleDesignEdit}
      onEdit={handleDesignEdit}
      onSave={handleDesignSave}
    />
  );

  return (
    <View style={styles.container}>
      {/* Minimal Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>مكتبة التصاميم</Text>
          <Text style={styles.headerSubtitle}>اختر التصميم المثالي وابدأ التخصيص</Text>
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
              placeholder="ابحث عن التصميم المثالي..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <FontAwesome6 name="times" size={14} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.searchButton, loading && styles.searchButtonLoading]}
            onPress={handleSearch}
            disabled={loading || !searchQuery.trim()}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="auto-awesome" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        {/* Quick Search Tags */}
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionTags}>
            {['بطاقة أعمال', 'شعار', 'فلاير', 'بوستر', 'إعلان'].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionTag}
                onPress={() => {
                  setSearchQuery(suggestion);
                  handleSearch();
                }}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Results */}
      {hasSearched && (
        <View style={styles.resultsSection}>
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

      {/* Initial State */}
      {!hasSearched && (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#f8fafc',
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
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.sm,
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
  searchButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonLoading: {
    opacity: 0.7,
  },
  suggestionsContainer: {
    marginTop: SPACING.lg,
  },
  suggestionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  suggestionTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  suggestionText: {
    fontSize: 14,
    color: BRAND_COLORS.text.primary,
    fontWeight: '500',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: BRAND_COLORS.text.secondary,
    fontSize: 16,
    marginTop: SPACING.lg,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
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
    paddingVertical: 60,
  },
  emptyTitle: {
    color: BRAND_COLORS.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.lg,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  emptySubtitle: {
    color: BRAND_COLORS.text.secondary,
    fontSize: 14,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  initialState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 60,
  },
  initialIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
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
  cardContent: {
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
  },
  designTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  designDescription: {
    fontSize: 14,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  editButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
});