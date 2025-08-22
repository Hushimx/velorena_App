import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

const YELLOW = '#F4D03F';
const YELLOW_DARK = '#E9C318';
const BRAND_BLUE = '#1e40af';
const TEXT_DARK = '#111827';
const GRAY = '#9CA3AF';
const LIGHT_GRAY = '#F9FAFB';

type Option = { id: string; label: string };
type GroupKey = "size" | "paperType" | "paperWeight";

const SIZE_OPTIONS: Option[] = [
  { id: "custom", label: "حسب الطلب" },
  { id: "a3", label: "A3" },
  { id: "a5", label: "A5" },
  { id: "a4", label: "A4" },
];

const PAPER_TYPE_OPTIONS: Option[] = [
  { id: "matte", label: "كوشيه مطفي" },
  { id: "gloss", label: "كوشيه لامع" },
  { id: "art", label: "عادي" },
  { id: "duplex", label: "ورق كانسون" },
];

const PAPER_WEIGHT_OPTIONS: Option[] = [
  { id: "300", label: "جم 300" },
  { id: "250", label: "جم 250" },
  { id: "200", label: "جم 200" },
  { id: "150", label: "جم 150" },
];

// Product data - in a real app, this would come from an API
const PRODUCT_DATA: Record<string, any> = {
  'p1': {
    id: 'p1',
    title: 'كتالوج الإضاءة 2025',
    image: 'https://images.unsplash.com/photo-1567688535100-5dc79f1ca57e?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    price: 120,
    rating: 4.5,
    ratingCount: 2553,
    description: 'اكتشف مجموعتنا الحصرية من وحدات الإضاءة التي تجمع بين التصميم العصري والأناقة الراقية. هذا الكتالوج يقدم لك تشكيلة متنوعة من المصابيح والإضاءة المتطورة.'
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

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [selections, setSelections] = useState<Record<GroupKey, string>>({
    size: "a5",
    paperType: "matte",
    paperWeight: "300",
  });
  const [isFavorite, setIsFavorite] = useState(false);

  const product = PRODUCT_DATA[id as string];

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
    const size = SIZE_OPTIONS.find((o) => o.id === selections.size)?.label;
    const type = PAPER_TYPE_OPTIONS.find((o) => o.id === selections.paperType)?.label;
    const weight = PAPER_WEIGHT_OPTIONS.find((o) => o.id === selections.paperWeight)?.label;
    return `${size} • ${type} • ${weight}`;
  }, [selections]);

  const handleAddToCart = () => {
    Alert.alert(
      'إضافة إلى السلة',
      `تم إضافة ${product.title} إلى السلة`,
      [{ text: 'موافق', style: 'default' }]
    );
  };

  const handleBuyNow = () => {
    Alert.alert(
      'شراء المنتج',
      `المتابعة لشراء ${product.title}؟`,
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
          <MaterialIcons name="arrow-back" size={24} color={BRAND_BLUE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>السلة</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="shopping-cart" size={24} color={BRAND_BLUE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <View style={styles.imageCard}>
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {/* Favorite Button */}
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.8}
          >
                         <MaterialIcons 
               name={isFavorite ? "favorite" : "favorite-border"} 
               size={20} 
               color={isFavorite ? "#dc2626" : BRAND_BLUE} 
             />
          </TouchableOpacity>

          {/* Title Overlay */}
          <View style={styles.titleOverlay}>
            <Text style={styles.productTitle}>{product.title}</Text>
          </View>
        </View>

        {/* Price & Rating */}
        <View style={styles.priceRatingRow}>
          <View style={styles.pricePill}>
            <MaterialIcons name="account-balance-wallet" size={16} color={'#ffffff'} />
            <Text style={styles.priceText}>ريال </Text>
            <Text style={styles.priceText}>{product.price}</Text>
          </View>
          <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            <MaterialIcons name="star" size={16} color="#F59E0B" />
            <Text style={styles.ratingText}>
               <Text style={styles.ratingCount}>(شخص {product.ratingCount})</Text>
            </Text>
          </View>
        </View>

        {/* Description */}
        <Section title="الوصف">
          <Text style={styles.description}>{product.description}</Text>
        </Section>

        {/* Size Selection */}
        <Section title="الحجم" iconName="maximize">
          <ChipGroup
            options={SIZE_OPTIONS}
            value={selections.size}
            onChange={(v) => onSelect("size", v)}
          />
        </Section>

        {/* Paper Type */}
        <Section title="نوع الورق" iconName="scroll">
          <ChipGroup
            options={PAPER_TYPE_OPTIONS}
            value={selections.paperType}
            onChange={(v) => onSelect("paperType", v)}
          />
        </Section>

        {/* Paper Weight */}
        <Section title="وزن الورق" iconName="scale-balanced">
          <ChipGroup
            options={PAPER_WEIGHT_OPTIONS}
            value={selections.paperWeight}
            onChange={(v) => onSelect("paperWeight", v)}
          />
        </Section>

        {/* Selected Variant Summary */}
        <View style={styles.variantSummary}>
          <Text style={styles.variantText}>{variantSummary}</Text>
        </View>

        {/* Bottom padding for footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <MaterialIcons name="shopping-cart" size={16} color="#ffffff" />
          <Text style={styles.addToCartText}>إضافة الى السلة</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={handleBuyNow}
          activeOpacity={0.8}
        >
          <MaterialIcons name="payments" size={16} color={BRAND_BLUE} />
          <Text style={styles.buyButtonText}>شراء</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ========== Reusable Components ========== */

function Section({
  title,
  iconName,
  children,
}: {
  title: string;
  iconName?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {iconName && <FontAwesome6 name={iconName as any} size={12} color={BRAND_BLUE} />}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={styles.chipsContainer}>
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.chip, isActive && styles.chipActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {option.label}
            </Text>
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: YELLOW_DARK,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansArabic_700Bold',
    color: BRAND_BLUE,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  imageCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  productImage: {
    width: '100%',
    height: 240,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderColor: BRAND_BLUE,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  productTitle: {
    color: '#FFFFFFFF',
    fontSize: 18,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    textAlign: 'right',
  },
  priceRatingRow: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_BLUE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_BLUE,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  priceText: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: '#ffffff',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: TEXT_DARK,
    fontSize: 14,
  },
  ratingCount: {
    color: GRAY,
    fontFamily: 'NotoSansArabic_500Medium',
    fontSize: 12,
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: YELLOW_DARK,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: YELLOW_DARK,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    alignSelf: 'flex-end',
    height: 40,
  },

  sectionTitle: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    fontSize: 12,
    color: BRAND_BLUE,
  },
  description: {
    color: GRAY,
    lineHeight: 24,
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_400Regular',
    fontSize: 14,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: BRAND_BLUE,
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  chipActive: {
    backgroundColor: BRAND_BLUE,
    borderColor: BRAND_BLUE,
  },
  chipText: {
    color: TEXT_DARK,
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#ffffff',
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
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addToCartButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BRAND_BLUE,
    borderWidth: 1,
    borderColor: YELLOW_DARK,
  },
  addToCartText: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: '#ffffff',
    fontSize: 14,
  },
  buyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: YELLOW,
  },
  buyButtonText: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: BRAND_BLUE,
    fontSize: 14,
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
    color: BRAND_BLUE,
  },
});
