import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  I18nManager,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const YELLOW = '#F4D03F';
const YELLOW_DARK = '#E9C318';
const BLUE_ACTIVE = '#2563EB';
const TEXT_DARK = '#111827';
const GRAY = '#9CA3AF';
const BRAND_BLUE = '#1e40af';

const categoryData = [
  {
    id: 'catalog',
    title: 'كتالوج',
    iconName: 'book-open',
  },
  {
    id: 'notebook',
    title: 'كشكول',
    iconName: 'book',
  },
  {
    id: 'cards',
    title: 'الكروت\nالشخصية',
    iconName: 'id-card',
  },
  {
    id: 'spiral',
    title: 'كشكول\nبسلك',
    iconName: 'book-open-reader',
  },
] as const;

const productData = [
  {
    id: 'p1',
    image: 'https://images.unsplash.com/photo-1567688535100-5dc79f1ca57e?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    id: 'p2',
    image: 'https://images.unsplash.com/photo-1632965052834-41db7f427dcc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fG5vdGVib29rfGVufDB8MnwwfHx8MA%3D%3D',
  },
  {
    id: 'p3',
    image: 'https://images.unsplash.com/photo-1557752281-9287e90d3bdf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGJsYWNrJTIwbm90ZWJvb2t8ZW58MHwyfDB8fHww',
  },
  {
    id: 'p4',
    image: 'https://imgs.search.brave.com/nCuPug1eoSFNltd8FYvQk1A_RChY9dA0Ixilurj9wRI/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/NzE2aHpQSElodkwu/anBn',
  },
];

export default function HomeScreen() {
  const appear = useRef(new Animated.Value(0)).current;
  const appearSlow = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(appear, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appearSlow, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [appear, appearSlow]);

  const isRTL = useMemo(() => I18nManager.isRTL ?? true, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change language"
            style={styles.globeBtn}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <FontAwesome6 name="globe" size={20} color={BRAND_BLUE} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="tune" size={20} color={BRAND_BLUE} style={{ marginLeft: 6 }} />
            <Text style={styles.headerButtonText}>فلتر</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Search */}
        <Animated.View style={[styles.searchWrapper, { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
          <TextInput placeholder="ابحث هنا" placeholderTextColor={GRAY} style={styles.searchInput} textAlign="right" />
          <MaterialIcons name="search" size={20} color={GRAY} style={styles.searchIcon} />
        </Animated.View>

        {/* Categories */}
        <Animated.View style={[styles.categoriesGrid, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          {categoryData.map((item) => (
            <View key={item.id} style={styles.categoryItem}>
              <View style={styles.categoryIconBox}>
                <FontAwesome6 name={item.iconName as any} size={28} color={BRAND_BLUE} />
              </View>
              <Text style={styles.categoryLabel}>{item.title}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Promo Banner */}
        <Animated.View style={[styles.promoCard, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
          <View style={styles.promoImageWrap}>
            <Image source={{ uri: 'https://imgs.search.brave.com/NDMJXMynxCwccZfgAkAU8S7J-RMRvQKsQzsY5BLPLV0/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9wbHVz/LnVuc3BsYXNoLmNv/bS9wcmVtaXVtX3Bo/b3RvLTE2Njk2NTI2/MzkzMzctYzUxM2Nj/NDJlYWQ2P2ZtPWpw/ZyZxPTYwJnc9MzAw/MCZpeGxpYj1yYi00/LjEuMCZpeGlkPU0z/d3hNakEzZkRCOE1I/eHpaV0Z5WTJoOE1Y/eDhZbTl2YTNOOFpX/NThNSHg4TUh4OGZE/QT0' }} style={styles.promoImage} />
          </View>
          <View style={styles.promoTextWrap}>
            <Text style={[styles.promoTitle, { color: BRAND_BLUE }]}>تفقد أحدث العروض</Text>
            <View style={styles.discountBadge}><Text style={[styles.discountText, { color: BRAND_BLUE }]}>خصم 10%</Text></View>
            <Text style={[styles.promoDesc, { color: BRAND_BLUE }]}>كشكول 150 صفحة متعدد الألوان</Text>
            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={[styles.detailsBtnText, { color: BRAND_BLUE }]}>التفاصيل</Text>
              <MaterialIcons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color={BRAND_BLUE} style={{ marginHorizontal: 4 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: '#9CA3AF' }]} />
          <View style={[styles.dot, { backgroundColor: '#E5E7EB' }]} />
          <View style={[styles.dot, { backgroundColor: '#E5E7EB' }]} />
        </View>

        {/* Latest offers header */}
        <View style={styles.offersHeader}> 
          <TouchableOpacity style={styles.offersPill}><Text style={styles.offersPillText}>أحدث العروض</Text></TouchableOpacity>
        </View>

        {/* Products grid */}
        <Animated.View style={[styles.productsGrid, { opacity: appearSlow, transform: [{ translateY: appearSlow.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {productData.map((p) => (
            <View key={p.id} style={styles.productCard}>
              <Image source={{ uri: p.image }} style={styles.productImage} />
              <View style={styles.productFooter}>
                <TouchableOpacity style={styles.productBtn}>
                  <Text style={styles.productBtnText}>التفاصيل</Text>
                  <MaterialIcons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color={BRAND_BLUE} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButtonText: {
    color: '#4B5563',
    fontSize: 14,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  langSwitch: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_700Bold',
    color: TEXT_DARK,
  },
  globeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  searchWrapper: {
    position: 'relative',
    marginTop: 4,
    borderColor: YELLOW_DARK,
    borderWidth: 1,
    borderRadius: 15,
  },
  searchInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 40,
    color: '#1e40af',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    marginTop: -10,
  },
  categoriesGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '23%',
    alignItems: 'center',
  },
  categoryIconBox: {
    backgroundColor: YELLOW,
    padding: 10,
    borderRadius: 10,
  },
  categoryLabel: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
    fontFamily: 'NotoSansArabic_500Medium',
  },
  promoCard: {
    marginTop: 16,
    borderRadius: 16,
    borderColor: YELLOW_DARK,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoImageWrap: {
    width: '40%',
  },
  promoImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  promoTextWrap: {
    width: '60%',
    paddingStart: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  promoTitle: {
    fontSize: 20,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: TEXT_DARK,
    textAlign: 'center',
  },
  discountBadge: {
    alignSelf: 'center',
    backgroundColor: YELLOW,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  discountText: {
    fontFamily: 'NotoSansArabic_700Bold',
    color: BRAND_BLUE,
    fontSize: 12,
  },
  promoDesc: {
    marginTop: 6,
    color: '#4B5563',
    fontSize: 12,
    textAlign: 'center',
  },
  detailsBtn: {
    marginTop: 10,
    backgroundColor: YELLOW_DARK,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  detailsBtnText: {
    color: '#fff',
    fontFamily: 'NotoSansArabic_700Bold',
    marginHorizontal: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  offersHeader: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  offersPill: {
    backgroundColor: YELLOW,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  offersPillText: {
    color: BRAND_BLUE,
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 12,
  },
  productsGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  productFooter: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productBtn: {
    backgroundColor: YELLOW,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'center',
  },
  productBtnText: {
    color: BRAND_BLUE,
    fontSize: 12,
    fontFamily: 'NotoSansArabic_700Bold',
    marginHorizontal: 2,
  },
});
