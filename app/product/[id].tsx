import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildCartItemKey, useCartStore } from '../../store/useCartStore';

// Theme colors
const PRIMARY = '#2a1e1e';
const SECONDARY = '#ffde9f';
const TEXT_PRIMARY = '#2a1e1e';
const TEXT_SECONDARY = '#6b7280';
const GRAY_LIGHT = '#f3f4f6';
const GRAY_MEDIUM = '#9ca3af';
const WHITE = '#ffffff';

// Helper function to extract image URI
const getProductImageUri = (product: any): string => {
  const fallbackImage = 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center&q=60';
  
  if (product?.image && product.image !== 'https://via.placeholder.com/400x300') {
    return product.image;
  }
  
  return fallbackImage;
};

// Helper function to get all product images
const getProductImages = (product: any): string[] => {
  if (product?.images && product.images.length > 0) {
    const validImages = product.images
      .map((img: any) => typeof img === 'string' ? img : (img?.image_url || img?.url || img))
      .filter((url: string) => url && !url.includes('via.placeholder.com'));
    if (validImages.length > 0) {
      return validImages;
    }
  }
  
  return [getProductImageUri(product)];
};

// Product option types
type Option = { id: string; label: string };
type GroupKey = "materialType" | "colorPrint" | "bagSize" | "printSide" | "bagShape";

const MATERIAL_TYPE_OPTIONS: Option[] = [
  { id: "matte", label: "مات" },
  { id: "plastic", label: "بلاستيك" },
  { id: "kraft", label: "كرافت" },
  { id: "glossy", label: "لامع" },
];

const COLOR_PRINT_OPTIONS: Option[] = [
  { id: "fullColor", label: "الوان كاملة" },
  { id: "singleColor", label: "لون واحد" },
  { id: "specialColor", label: "الوان خاصة" },
];

const BAG_SIZE_OPTIONS: Option[] = [
  { id: "small", label: "صغير (250جم)" },
  { id: "medium", label: "وسط (100جم)" },
  { id: "large", label: "كبير (250جم)" },
];

const PRINT_SIDE_OPTIONS: Option[] = [
  { id: "oneSide", label: "وجه واحد" },
  { id: "twoSides", label: "وجهين" },
];

const BAG_SHAPE_OPTIONS: Option[] = [
  { id: "reclosable", label: "قابل للغلق" },
  { id: "zip", label: "قفل بالسحاب" },
  { id: "noSeal", label: "بدون قفل" },
];

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // State
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<GroupKey, string>>({
    materialType: "glossy",
    colorPrint: "fullColor",
    bagSize: "large",
    printSide: "twoSides",
    bagShape: "reclosable",
  });
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const [isBagShapeOpen, setIsBagShapeOpen] = useState(false);
  const [quantity, setQuantity] = useState(2);

  // Fetch product data
  useEffect(() => {
    if (!id) return;
    
    console.log('🚀 Starting API call with ID:', id);
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = `http://134.255.216.155:8001/api/products/${id}`;
        console.log('🔍 API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        console.log('🔄 Response status:', response.status);
        
        if (response.ok) {
          const jsonData = await response.json();
          console.log('🔄 JSON response:', jsonData);
          
          if (jsonData?.success && jsonData?.data) {
            setProduct(jsonData.data);
            console.log('✅ Product loaded:', jsonData.data.name || jsonData.data.name_ar);
          } else {
            setError('Invalid response format from API');
          }
        } else {
          const errorText = await response.text();
          console.error('❌ HTTP Error:', response.status, errorText);
          setError(`HTTP Error ${response.status}: ${errorText}`);
        }
      } catch (fetchError: any) {
        console.error('❌ Fetch error:', fetchError);
        setError(fetchError?.message || 'Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Event handlers
  const onSelect = (group: GroupKey, optionId: string) =>
    setSelections((s) => ({ ...s, [group]: optionId }));

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const { addItem, items, updateQuantity, removeItem } = useCartStore();
  
  // Check if current product with options is in cart
  const getCurrentCartItem = () => {
    if (!product) return null;
    const itemKey = buildCartItemKey({
      id: String(product.id ?? product._id ?? id),
      options: {
        materialType: selections.materialType,
        colorPrint: selections.colorPrint,
        bagSize: selections.bagSize,
        printSide: selections.printSide,
        bagShape: selections.bagShape,
      },
    });
    return items.find(item => buildCartItemKey(item) === itemKey);
  };

  const currentCartItem = getCurrentCartItem();
  const isInCart = !!currentCartItem;

  const handleAddToCart = () => {
    if (!product) return;
    const price = Number(product.base_price || product.price || 0);
    addItem(
      {
        id: String(product.id ?? product._id ?? id),
        name: product.name,
        name_ar: product.name_ar,
        description: product.description,
        description_ar: product.description_ar,
        image: getProductImages(product)[0],
        price,
        options: {
          materialType: selections.materialType,
          colorPrint: selections.colorPrint,
          bagSize: selections.bagSize,
          printSide: selections.printSide,
          bagShape: selections.bagShape,
        },
      },
      quantity
    );
    router.push('/cart');
  };

  const handleViewCart = () => {
    router.push('/cart');
  };

  const handleUpdateCartQuantity = (newQuantity: number) => {
    if (!currentCartItem) return;
    const itemKey = buildCartItemKey(currentCartItem);
    if (newQuantity <= 0) {
      removeItem(itemKey);
    } else {
      updateQuantity(itemKey, newQuantity);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>جاري تحميل المنتج...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No product found
  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>المنتج غير موجود</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل المنتج</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="shopping-cart" size={24} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Product Images Carousel */}
        <View style={styles.imageCard} onLayout={(e) => setCarouselWidth(e.nativeEvent.layout.width)}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const width = carouselWidth || e.nativeEvent.layoutMeasurement.width || 1;
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              if (index !== activeImageIndex) setActiveImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {getProductImages(product).map((imageUri: string, index: number) => (
              <Image
                key={`image-${index}-${imageUri}`}
                source={{ uri: imageUri }}
                style={[styles.productImage, carouselWidth ? { width: carouselWidth } : null]}
                resizeMode="cover"
                defaultSource={{ uri: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop&crop=center&q=60' }}
              />
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {getProductImages(product).map((_: string, i: number) => (
              <View
                key={`dot-${i}`}
                style={[
                  styles.dot,
                  i === activeImageIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Favorite Button */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => setIsFavorite(!isFavorite)}
          activeOpacity={0.8}
        >
          <MaterialIcons 
            name={isFavorite ? "favorite" : "favorite-border"} 
            size={24} 
            color={isFavorite ? '#ef4444' : PRIMARY} 
          />
        </TouchableOpacity>

        {/* Product Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.productTitle}>
            {product.name_ar || product.name}
          </Text>
        </View>

        {/* Description with Price and Quantity */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>
            {product.description_ar || product.description}
          </Text>
          <View style={styles.priceQuantityRow}>
            <Text style={styles.priceText}>
              {product.base_price || product.price} ريال
            </Text>
            {!isInCart && (
              <View style={styles.quantityContainer}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={decreaseQuantity}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="remove" size={20} color={WHITE} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={increaseQuantity}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="add" size={20} color={WHITE} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Product Options */}
        <Section title="نوع الخامة :">
          <RadioGroup
            options={MATERIAL_TYPE_OPTIONS}
            value={selections.materialType}
            onChange={(v) => onSelect("materialType", v)}
          />
        </Section>

        <Section title="الطباعة الالوان :">
          <RadioGroup
            options={COLOR_PRINT_OPTIONS}
            value={selections.colorPrint}
            onChange={(v) => onSelect("colorPrint", v)}
          />
        </Section>

        <Section title="حجم الكيس :">
          <RadioGroup
            options={BAG_SIZE_OPTIONS}
            value={selections.bagSize}
            onChange={(v) => onSelect("bagSize", v)}
          />
        </Section>

        <Section title="مكان الطباعة :">
          <RadioGroup
            options={PRINT_SIDE_OPTIONS}
            value={selections.printSide}
            onChange={(v) => onSelect("printSide", v)}
          />
        </Section>

        {/* Bag Shape (Dropdown) */}
        <Section title="شكل الكيس :">
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setIsBagShapeOpen((o) => !o)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownHeaderText}>
              {BAG_SHAPE_OPTIONS.find(o => o.id === selections.bagShape)?.label}
            </Text>
            <MaterialIcons name={isBagShapeOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={PRIMARY} />
          </TouchableOpacity>
          {isBagShapeOpen && (
            <View style={styles.dropdownList}>
              {BAG_SHAPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={styles.dropdownItem}
                  onPress={() => { onSelect('bagShape', opt.id); setIsBagShapeOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownItemText, selections.bagShape === opt.id && styles.dropdownItemTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        {/* Bottom padding for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {isInCart ? (
          <View style={styles.cartControlsContainer}>
            <View style={styles.cartQuantityContainer}>
              <TouchableOpacity 
                style={styles.cartQuantityButton}
                onPress={() => handleUpdateCartQuantity((currentCartItem?.quantity || 0) - 1)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="remove" size={20} color={WHITE} />
              </TouchableOpacity>
              <Text style={styles.cartQuantityText}>{currentCartItem?.quantity || 0}</Text>
              <TouchableOpacity 
                style={styles.cartQuantityButton}
                onPress={() => handleUpdateCartQuantity((currentCartItem?.quantity || 0) + 1)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add" size={20} color={WHITE} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.viewCartButton}
              onPress={handleViewCart}
              activeOpacity={0.8}
            >
              <MaterialIcons name="shopping-cart" size={20} color={WHITE} />
              <Text style={styles.viewCartText}>عرض العربة</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add-shopping-cart" size={20} color={WHITE} />
            <Text style={styles.addToCartText}>اضافة الى عربة التسوق</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ========== Reusable Components ========== */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.radioContainer}>
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onChange(option.id)}
            style={styles.radioOption}
            activeOpacity={0.7}
          >
            <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
              {isActive && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ========== Styles ========== */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansArabic_700Bold',
    color: PRIMARY,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageCard: {
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: WHITE,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 320,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    width: 20,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  titleContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: PRIMARY,
    textAlign: 'right',
    lineHeight: 32,
  },
  descriptionContainer: {
    marginHorizontal: 16,
    backgroundColor: GRAY_LIGHT,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  description: {
    color: TEXT_SECONDARY,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'NotoSansArabic_400Regular',
    fontSize: 15,
    marginBottom: 16,
  },
  priceQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  priceText: {
    fontSize: 24,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: PRIMARY,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityText: {
    fontSize: 18,
    fontFamily: 'NotoSansArabic_700Bold',
    color: PRIMARY,
    minWidth: 24,
    textAlign: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    borderColor: PRIMARY,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 16,
    marginTop: 12,
  },
  section: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: WHITE,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
    color: PRIMARY,
    textAlign: 'right',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_LIGHT,
    paddingBottom: 12,
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: GRAY_MEDIUM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: PRIMARY,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },
  radioText: {
    fontSize: 13,
    fontFamily: 'NotoSansArabic_500Medium',
    color: PRIMARY,
    marginLeft: 8,
    textAlign: 'center',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GRAY_LIGHT,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dropdownHeaderText: {
    fontSize: 15,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: PRIMARY,
  },
  dropdownList: {
    marginTop: 8,
    backgroundColor: WHITE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: 'NotoSansArabic_500Medium',
    color: PRIMARY,
  },
  dropdownItemTextActive: {
    fontFamily: 'NotoSansArabic_700Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: WHITE,
  },
  addToCartButton: {
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addToCartText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: WHITE,
    fontSize: 16,
  },
  cartControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 4,
    gap: 8,
  },
  cartQuantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartQuantityText: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_700Bold',
    color: WHITE,
    minWidth: 24,
    textAlign: 'center',
  },
  viewCartButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  viewCartText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: WHITE,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'NotoSansArabic_700Bold',
    color: TEXT_PRIMARY,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: SECONDARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: PRIMARY,
  },
});
