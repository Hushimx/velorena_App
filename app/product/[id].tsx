import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProductDetail } from '../../utils/api';

// Pink theme colors to match the image
const YELLOW = '#ffde9f';
const YELLOW_DARK = '#f5d182';
const BROWN_DARK = '#2a1e1e';
const TEXT_DARK = '#2a1e1e';
const GRAY = '#9CA3AF';
const LIGHT_GRAY = '#F9FAFB';
const WHITE = '#ffffff';

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

// Product data - in a real app, this would come from an API
const PRODUCT_DATA: Record<string, any> = {
  'p1': {
    id: 'p1',
    title: 'فواكه مجففة',
    image: 'https://images.unsplash.com/photo-1567688535100-5dc79f1ca57e?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    images: [
      'https://images.unsplash.com/photo-1567688535100-5dc79f1ca57e?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'https://images.unsplash.com/photo-1499096382193-ebb232527fee?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cHJvZHVjdHN8ZW58MHwyfDB8fHww',
      'https://plus.unsplash.com/premium_photo-1675896084254-dcb626387e1e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZHVjdHN8ZW58MHwyfDB8fHww'
    ],
    price: 75,
    rating: 4.0,
    ratingCount: 778,
    description: 'استمتع بمزيج لذيذ يجمع بين الفواكه الطبيعية المجففة، المكسرات المعطرة بالسودولة، وحلوى الجيلي بالفواكه كل كيس مصمم بألوان عصرية تعكس نكهته المميزة، مثل الكيوي، البرتقال، المراولة، جوز الهند، البرقوق، وغيرها'
  },
  'p2': {
    id: 'p2',
    title: 'كشكول متعدد الأغراض',
    image: 'https://images.unsplash.com/photo-1632965052834-41db7f427dcc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fG5vdGVib29rfGVufDB8MnwwfHx8MA%3D%3D',
    price: 85,
    rating: 4.2,
    ratingCount: 1420,
    description: 'كشكول عملي ومتين مناسب لجميع الاستخدامات اليومية. يحتوي على أوراق عالية الجودة ومقاوم للتلف مع تصميم أنيق وعملي.'
  },
  'p3': {
    id: 'p3',
    title: 'دفتر ملاحظات أسود',
    image: 'https://images.unsplash.com/photo-1557752281-9287e90d3bdf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGJsYWNrJTIwbm90ZWJvb2t8ZW58MHwyfDB8fHww',
    price: 95,
    rating: 4.7,
    ratingCount: 890,
    description: 'دفتر ملاحظات أنيق باللون الأسود مع تصميم كلاسيكي. مثالي للاستخدام المهني والشخصي مع أوراق ناعمة وغلاف متين.'
  },
  'p4': {
    id: 'p4',
    title: 'مجموعة دفاتر ملونة',
    image: 'https://imgs.search.brave.com/nCuPug1eoSFNltd8FYvQk1A_RChY9dA0Ixilurj9wRI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NzE2aHpQSElodkwu/anBn',
    price: 150,
    rating: 4.3,
    ratingCount: 2100,
    description: 'مجموعة من الدفاتر الملونة المتنوعة مناسبة للطلاب والمهنيين. تتضمن ألوان زاهية وتصاميم جذابة مع جودة عالية في الطباعة.'
  }
};

// prefer API product but fall back to local mock (if any)
const currentProduct = (serverProduct: any, id: string) => serverProduct ?? (PRODUCT_DATA && PRODUCT_DATA[id as any]);

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
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

  const [serverProduct, setServerProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const product = currentProduct(serverProduct, id as string);

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

  const onSelect = (group: GroupKey, id: string) =>
    setSelections((s) => ({ ...s, [group]: id }));

  const variantSummary = useMemo(() => {
    const material = MATERIAL_TYPE_OPTIONS.find((o) => o.id === selections.materialType)?.label;
    const color = COLOR_PRINT_OPTIONS.find((o) => o.id === selections.colorPrint)?.label;
    const size = BAG_SIZE_OPTIONS.find((o) => o.id === selections.bagSize)?.label;
    const side = PRINT_SIDE_OPTIONS.find((o) => o.id === selections.printSide)?.label;
    return `${material} • ${color} • ${size} • ${side}`;
  }, [selections]);

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const res = await getProductDetail(id as string, ac.signal);
        setServerProduct(res?.data ?? res);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || 'تعذر تحميل المنتج');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [id]);

  const handleAddToCart = () => {
    Alert.alert(
      'إضافة إلى السلة',
      `تم إضافة ${(product.name_ar || product.name || product?.title)} إلى السلة`,
      [{ text: 'موافق', style: 'default' }]
    );
  };

  const handleBuyNow = () => {
    Alert.alert(
      'شراء المنتج',
      `المتابعة لشراء ${(product.name_ar || product.name || product?.title)}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'متابعة', style: 'default' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color={BROWN_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>السلة</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="shopping-cart" size={24} color={BROWN_DARK} />
        </TouchableOpacity>
      </View>

      {loading && !product ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#2a1e1e' }}>جاري التحميل…</Text>
        </View>
      ) : !product ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#b91c1c' }}>المنتج غير موجود</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
            {(product.images ?? [(product.image || product?.image)]).map((img: string) => (
              <Image
                key={img}
                source={{ uri: img }}
                style={[styles.productImage, carouselWidth ? { width: carouselWidth } : null]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {(product.images ?? [(product.image || product?.image)]).map((_: string, i: number) => (
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
            color={isFavorite ? 'red' : BROWN_DARK} 
          />
        </TouchableOpacity>

        {/* Product Title and Rating Row */}
        <View style={styles.titleRatingRow}>
        <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <MaterialIcons 
                key={star}
                name="star" 
                size={16} 
                color={star <= Math.floor(product.rating) ? BROWN_DARK : "#E5E7EB"} 
              />
            ))}
            <Text style={styles.ratingCount}>({product.ratingCount} reviews)</Text>
          </View>
          <Text style={styles.productTitle}>{(product.name_ar || product.name || product?.title)}</Text>
        </View>

        {/* Description with Price and Quantity */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{(product.description_ar || product.description || product?.description)}</Text>
          <View style={styles.priceQuantityRow}>
            <Text style={styles.priceText}>{(product.base_price || product?.price)} ريال</Text>
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
          </View>
        </View>

        {/* Material Type */}
        <Section title="نوع الخامة :">
          <RadioGroup
            options={MATERIAL_TYPE_OPTIONS}
            value={selections.materialType}
            onChange={(v) => onSelect("materialType", v)}
          />
        </Section>

        {/* Color Printing */}
        <Section title="الطباعة الالوان :">
          <RadioGroup
            options={COLOR_PRINT_OPTIONS}
            value={selections.colorPrint}
            onChange={(v) => onSelect("colorPrint", v)}
          />
        </Section>

        {/* Bag Size */}
        <Section title="حجم الكيس :">
          <RadioGroup
            options={BAG_SIZE_OPTIONS}
            value={selections.bagSize}
            onChange={(v) => onSelect("bagSize", v)}
          />
        </Section>

        {/* Print Side */}
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
            <MaterialIcons name={isBagShapeOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={BROWN_DARK} />
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
                  <Text style={[styles.dropdownItemText, selections.bagShape === opt.id && styles.dropdownItemTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        {/* Selected Variant Summary */}
        <View style={styles.variantSummary}>
          <Text style={styles.variantText}>{variantSummary}</Text>
        </View>

        {/* Bottom padding for footer */}
        <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <MaterialIcons name="shopping-cart" size={20} color={WHITE} />
          <Text style={styles.addToCartText}>اضافة الى عربة التسوق</Text>
        </TouchableOpacity>
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
    color: BROWN_DARK,
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
    backgroundColor: BROWN_DARK,
  },
  titleRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: BROWN_DARK,
    textAlign: 'right',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  descriptionContainer: {
    marginHorizontal: 16,
    backgroundColor: YELLOW,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  description: {
    color: BROWN_DARK,
    lineHeight: 24,
    textAlign: 'center',
    fontFamily: 'NotoSansArabic_400Regular',
    fontSize: 14,
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
    color: BROWN_DARK,
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
    backgroundColor: BROWN_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontFamily: 'NotoSansArabic_700Bold',
    color: BROWN_DARK,
    minWidth: 24,
    textAlign: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: YELLOW,
    borderColor: BROWN_DARK,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    marginHorizontal: 16,
    marginTop: 12,
  },
  ratingCount: {
    color: GRAY,
    fontFamily: 'NotoSansArabic_500Medium',
    fontSize: 12,
  },
  section: {
    marginTop: 10,
    marginHorizontal: 10,
    backgroundColor: WHITE,
    padding: 16,
  },


  sectionTitle: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
    color: BROWN_DARK,
    textAlign: 'right',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: GRAY,
    paddingBottom: 8,
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
    borderColor: GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: BROWN_DARK,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BROWN_DARK,
  },
  radioText: {
    fontSize: 12,
    fontFamily: 'NotoSansArabic_500Medium',
    color: BROWN_DARK,
    marginLeft: 8,
    textAlign: 'center',
  },
  shapeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: YELLOW,
    padding: 12,
    borderRadius: 8,
  },
  shapeText: {
    fontSize: 14,
    fontFamily: 'NotoSansArabic_500Medium',
    color: BROWN_DARK,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: YELLOW,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  dropdownHeaderText: {
    fontSize: 14,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: BROWN_DARK,
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
    fontSize: 14,
    fontFamily: 'NotoSansArabic_500Medium',
    color: BROWN_DARK,
  },
  dropdownItemTextActive: {
    fontFamily: 'NotoSansArabic_700Bold',
  },
  variantSummary: {
    marginTop: 16,
    marginHorizontal: 16,
    alignItems: 'flex-end',
  },
  variantText: {
    color: GRAY,
    fontFamily: 'NotoSansArabic_600SemiBold',
    fontSize: 14,
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
    backgroundColor: BROWN_DARK,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  addToCartText: {
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
    color: TEXT_DARK,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: YELLOW,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: BROWN_DARK,
  },
});
