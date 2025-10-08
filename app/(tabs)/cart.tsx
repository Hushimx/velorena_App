import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AuthBottomSheet from '../../components/AuthBottomSheet';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { TextLineSkeleton } from '../../components/Skeleton';
import { useAuthPrompt } from '../../hooks/useAuthPrompt';
import { useAuthStore, useHasHydrated, useIsAuthenticated } from '../../store/useAuthStore';
import { buildCartItemKey, useCartStore } from '../../store/useCartStore';
import { deleteDesignFromCart, getImageUrl } from '../../utils/api';

const YELLOW = '#ffde9f';
const BROWN = '#2a1e1e';
const WHITE = '#ffffff';
const GRAY = '#9CA3AF';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function CartScreen() {
  const router = useRouter();
  
  const items = useCartStore((s) => s.items);
  const cartDesigns = useCartStore((s) => s.cartDesigns);
  const loadingItems = useCartStore((s) => s.loadingItems);
  const loadingDesigns = useCartStore((s) => s.loadingDesigns);
  const loading = loadingItems || loadingDesigns;
  const error = useCartStore((s) => s.error);
  const loadCartItems = useCartStore((s) => s.loadCartItems);
  const loadCartDesigns = useCartStore((s) => s.loadCartDesigns);
  
  // Direct references to store functions
  const loadCartItemsCallback = loadCartItems;
  const loadCartDesignsCallback = loadCartDesigns;
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const { user } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const hasHydrated = useHasHydrated();
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const hasLoadedRef = useRef(false);
  const lastAuthStateRef = useRef(isAuthenticated);
  
  // Auth prompt hook
  const { authBottomSheetRef, customMessage, checkAuthAndPrompt } = useAuthPrompt();

  // Simple loading state - no debouncing
  const showSkeleton = !hasHydrated || (loading && items.length === 0 && cartDesigns.length === 0);

  // Load cart items on component mount - simplified logic
  useEffect(() => {
    // Wait for auth store to hydrate before making decisions
    if (!hasHydrated) {
      return;
    }

    // Reset loaded flag if auth state changed
    if (lastAuthStateRef.current !== isAuthenticated) {
      hasLoadedRef.current = false;
      lastAuthStateRef.current = isAuthenticated;
    }

    // Prevent multiple loads
    if (hasLoadedRef.current) {
      return;
    }
    
    if (isAuthenticated) {
      hasLoadedRef.current = true;
      loadCartItemsCallback();
      loadCartDesignsCallback();
    } else {
      // Only clear cart if we have items
      const currentItems = useCartStore.getState().items;
      const currentDesigns = useCartStore.getState().cartDesigns;
      if (currentItems.length > 0 || currentDesigns.length > 0) {
        useCartStore.setState({ items: [], cartDesigns: [], loadingItems: false, loadingDesigns: false, error: null });
      }
      hasLoadedRef.current = true;
    }
  }, [isAuthenticated, hasHydrated, loadCartItemsCallback, loadCartDesignsCallback]);

  // Reload cart when app comes back into focus or when screen is focused
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isAuthenticated && hasHydrated) {
        const currentState = useCartStore.getState();
        if (!currentState.loadingItems && !currentState.loadingDesigns) {
          loadCartItemsCallback();
          loadCartDesignsCallback();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, hasHydrated, loadCartItemsCallback, loadCartDesignsCallback]);


  const handleBackNavigation = () => {
    try {
      // Try to go back first
      if (router.canGoBack()) {
        router.back();
      } else {
        // If can't go back, navigate to home
        router.push('/(tabs)');
      }
    } catch {
      // Fallback to home if navigation fails
      router.push('/(tabs)');
    }
  };

  const handleDesignImagePress = (design: any) => {
    setSelectedDesign(design);
    setShowImageModal(true);
  };


  const handleDeleteCartDesign = async (cartDesign: any) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا التصميم؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteDesignFromCart({
                design_id: cartDesign.design_data?.original_design_id || cartDesign.id,
                title: cartDesign.title || 'تصميم',
                image_url: cartDesign.image_url
              });

              if (response.success) {
                // Reload cart designs to update the list
                await loadCartDesigns();
                Alert.alert('تم الحذف', 'تم حذف التصميم من السلة بنجاح!');
              } else {
                Alert.alert('خطأ', response.message || 'فشل في حذف التصميم');
              }
            } catch {
              Alert.alert('خطأ', 'فشل في حذف التصميم. حاول مرة أخرى');
            }
          }
        }
      ]
    );
  };

  const handleRemoveItem = async (cartItemId: number) => {
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

    try {
      await removeItem(cartItemId);
    } catch {
      Alert.alert('خطأ', 'فشل في حذف المنتج من السلة');
    }
  };

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
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

    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch {
      Alert.alert('خطأ', 'فشل في تحديث كمية المنتج');
    }
  };

  const handleBookAppointment = async () => {
    if (items.length === 0 && cartDesigns.length === 0) {
      Alert.alert('خطأ', 'السلة فارغة. أضف منتجات أو تصميمات أولاً');
      return;
    }

    // Check if user has phone number
    if (!user?.phone) {
      Alert.alert(
        'رقم الهاتف مطلوب',
        'يجب إضافة رقم الهاتف في الملف الشخصي لإنشاء طلب',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'إضافة رقم الهاتف', onPress: () => router.push('/profile' as any) }
        ]
      );
      return;
    }

    // Navigate directly to calendar - order will be created when making appointment
    const totalItems = items.length + cartDesigns.length;
    
    router.push({
      pathname: '/calendar' as any,
      params: { 
        hasCartItems: 'true', // Flag to indicate we have cart items
        cartItemCount: totalItems.toString()
      }
    });
  };

  // Show loading state while waiting for auth hydration or cart loading
  if (showSkeleton) {
    return (
      <SafeAreaWrapper backgroundColor="#f5f5f5">
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackNavigation} style={styles.iconButton}>
            <MaterialIcons name="arrow-forward" size={22} color={BROWN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>السلة</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonContainer}>
            {/* Header Skeleton */}
            <View style={styles.skeletonHeader}>
              <TextLineSkeleton width={100} height={20} />
            </View>
            
            {/* Cart Items Skeleton */}
            <View style={styles.skeletonItems}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={styles.skeletonCard}>
                  <TextLineSkeleton width="80%" height={16} />
                  <View style={styles.skeletonCardBody}>
                    <TextLineSkeleton width={120} height={80} />
                    <View style={styles.skeletonCardDetails}>
                      <TextLineSkeleton width="100%" height={14} />
                      <TextLineSkeleton width="70%" height={14} />
                      <TextLineSkeleton width="50%" height={16} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
            
            {/* Design Actions Skeleton */}
            <View style={styles.skeletonActions}>
              <TextLineSkeleton width={120} height={18} />
              <TextLineSkeleton width="100%" height={48} />
              <TextLineSkeleton width="100%" height={48} />
            </View>
          </View>
          
          
        </View>
      </SafeAreaWrapper>
    );
  }

  // Show unauthenticated state
  if (!isAuthenticated) {
    return (
      <SafeAreaWrapper backgroundColor="#f5f5f5">
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackNavigation} style={styles.iconButton}>
            <MaterialIcons name="arrow-forward" size={22} color={BROWN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>السلة</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.unauthenticatedContainer}>
          <MaterialIcons name="shopping-cart" size={64} color={GRAY} />
          <Text style={styles.unauthenticatedTitle}>تسجيل الدخول مطلوب</Text>
          <Text style={styles.unauthenticatedText}>
            يجب تسجيل الدخول لعرض وإدارة السلة
          </Text>
          <TouchableOpacity 
            onPress={() => router.push('/login')} 
            style={styles.loginButton}
            activeOpacity={0.8}
          >
            <MaterialIcons name="login" size={20} color={WHITE} />
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Show error state
  if (error && items.length === 0) {
    return (
      <SafeAreaWrapper backgroundColor="#f5f5f5">
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackNavigation} style={styles.iconButton}>
            <MaterialIcons name="arrow-forward" size={22} color={BROWN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>السلة</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={() => {
              hasLoadedRef.current = false; // Reset loaded flag to allow retry
              loadCartItemsCallback();
              loadCartDesignsCallback();
            }} 
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor="#f5f5f5">
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.iconButton}>
          <MaterialIcons name="arrow-forward" size={22} color={BROWN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>السلة</Text>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {items.length === 0 && cartDesigns.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>سلتك فارغة</Text>
          </View>
        )}
        
        {/* Combined Products and Designs Section */}
        {items.map((item, index) => {
          const key = item.cartItemId ? `cart-item-${item.cartItemId}` : `${buildCartItemKey(item)}-${index}`;
          return (
            <View key={key} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <MaterialIcons name="shopping-bag" size={20} color="#8B5CF6" />
                  <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.name_ar || item.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => item.cartItemId && handleRemoveItem(item.cartItemId)}
                  style={[styles.deleteHeaderBtn, loading && { opacity: 0.6 }]}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>

              <View style={styles.cardBody}>
                <Image
                  source={(() => {
                    const imageUrl = getImageUrl(item.image);
                    return imageUrl ? { uri: imageUrl } : require('../../assets/images/catagory-placeholer.png');
                  })()}
                  style={styles.cardImage}
                />

                <View style={styles.cardDetails}>
                  {(item.description_ar || item.description) && (
                    <Text style={styles.optionsText}>
                      {item.description_ar || item.description}
                    </Text>
                  )}

                  <View style={styles.actionsRow}>
                    <View style={styles.qtyBox}>
                      <TouchableOpacity
                        onPress={() => item.cartItemId && handleUpdateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))}
                        style={[styles.qtyBtn, loading && { opacity: 0.6 }]}
                        activeOpacity={0.8}
                        disabled={loading}
                      >
                        <MaterialIcons name="remove" size={18} color={WHITE} />
                      </TouchableOpacity>

                      <Text style={styles.qtyText}>{item.quantity}</Text>

                      <TouchableOpacity
                        onPress={() => item.cartItemId && handleUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        style={[styles.qtyBtn, loading && { opacity: 0.6 }]}
                        activeOpacity={0.8}
                        disabled={loading}
                      >
                        <MaterialIcons name="add" size={18} color={WHITE} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {/* Designs */}
        {cartDesigns.map((cartDesign, index) => (
          <View key={cartDesign.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <MaterialIcons name="palette" size={20} color="#8B5CF6" />
                <Text style={styles.cardTitle}>تصميم مخصص</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteCartDesign(cartDesign)}
                style={styles.deleteHeaderBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons name="delete-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cardBody}>
              <TouchableOpacity
                onPress={() => handleDesignImagePress(cartDesign)}
                style={styles.designImageContainer}
                activeOpacity={0.8}
              >
                <Image
                  source={(() => {
                    const imageUrl = getImageUrl(cartDesign.image_url);
                    return imageUrl ? { uri: imageUrl } : require('../../assets/images/catagory-placeholer.png');
                  })()}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.designImageOverlay}>
                  <View style={styles.zoomIconContainer}>
                    <MaterialIcons name="zoom-in" size={32} color={WHITE} />
                  </View>
                  <Text style={styles.zoomText}>معاينة</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.cardDetails}>
                <View style={styles.designCategory}>
                  <MaterialIcons name="shopping-cart" size={14} color="#10B981" />
                  <Text style={styles.designCategoryText}>محفوظ في السلة</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Design Creation Options */}
        <View style={styles.designActionsContainer}>
            {/* AI Design Generation Button */}
            <TouchableOpacity 
              style={styles.addDesignBtn} 
              activeOpacity={0.85}
              onPress={() => router.push('/designs')}
            >
              <MaterialIcons name="auto-awesome" size={20} color={WHITE} />
              <Text style={styles.addDesignText}>استلهام تصميم بالذكاء الصناعي</Text>
            </TouchableOpacity>
            
            {/* Upload Ready Design Button */}
            <TouchableOpacity 
              style={styles.uploadDesignBtn} 
              activeOpacity={0.85}
              onPress={() => router.push('/upload-design')}
            >
              <MaterialIcons name="cloud-upload" size={20} color={WHITE} />
              <Text style={styles.uploadDesignText}>رفع تصميم جاهز</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonsContainer}>
          <TouchableOpacity
            disabled={items.length === 0 && cartDesigns.length === 0}
            style={[styles.appointmentBtn, (items.length === 0 && cartDesigns.length === 0) && { opacity: 0.6 }]}
            onPress={() => {
              checkAuthAndPrompt(handleBookAppointment, 'يجب تسجيل الدخول لحجز موعد');
            }}
            activeOpacity={0.85}
          >
            <MaterialIcons name="event" size={20} color={BROWN} />
            <Text style={styles.appointmentText}>احجز موعد</Text>
          </TouchableOpacity>
          

        </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>



      </View>

      {/* Image Preview Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={24} color={WHITE} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalImageContainer}>
              <Image
                source={(() => {
                  const imageUrl = getImageUrl(selectedDesign?.image_url);
                  return imageUrl ? { uri: imageUrl } : require('../../assets/images/catagory-placeholer.png');
                })()}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>
            
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowImageModal(false);
                  router.push({
                    pathname: '/photo-editor',
                    params: {
                      designId: selectedDesign?.design_data?.original_design_id || selectedDesign?.id,
                      designImage: getImageUrl(selectedDesign?.image_url)
                    }
                  });
                }}
                style={styles.modalEditBtn}
                activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={20} color={WHITE} />
                <Text style={styles.modalEditText}>تعديل التصميم</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Auth Bottom Sheet */}
      <AuthBottomSheet
        bottomSheetRef={authBottomSheetRef}
        title="تسجيل الدخول مطلوب"
        message={customMessage || "يجب تسجيل الدخول أولاً للوصول إلى هذه الميزة"}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },

  mainContainer: {
    flex: 1,
    flexDirection: 'column',
  },

  header: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: 'relative',
  },
  iconButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: YELLOW, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'NotoSansArabic_800ExtraBold', fontSize: 20, color: BROWN, textAlign: 'center', position: 'absolute', left: 0, right: 0, bottom: 0 },

  content: { 
    padding: 16, 
    paddingBottom: 100,
  },

  /* Card */
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  /* Title */
  cardHeader: { 
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: BROWN,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    flex: 1,
  },
  deleteHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  /* Body – image on right, text on left */
  cardBody: {
    flexDirection: 'row-reverse',    // puts image on the right
    alignItems: 'flex-start',
    gap: 16,
  },
  cardImage: {
    width: 160,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
  },

  cardDetails: {
    flex: 1,
    gap: 12,
    justifyContent: 'flex-start',
  },
  optionsText: { 
    color: '#64748b', 
    fontFamily: 'NotoSansArabic_500Medium',
    fontSize: 14,
    lineHeight: 20, 
    textAlign: 'right' 
  },

  /* Qty controls */
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyBtn: { 
    backgroundColor: YELLOW, 
    width: 36, 
    height: 36, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 0,
  },
  qtyText: { 
    paddingHorizontal: 16, 
    fontFamily: 'NotoSansArabic_700Bold', 
    color: BROWN,
    fontSize: 16,
  },



  /* Design Actions Container */
  designActionsContainer: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  /* Add Design button */
  addDesignBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addDesignText: { 
    color: WHITE, 
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
    textAlign: 'right',
  },

  /* Upload Design button */
  uploadDesignBtn: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadDesignText: { 
    color: WHITE, 
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
    textAlign: 'right',
  },

  /* Designs Section */
  designsSection: {
    marginBottom: 10,
  },
  cartDesignsContainer: {
    marginTop: 8,
  },
  subSectionTitle: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
    color: BROWN,
    marginBottom: 16,
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    fontSize: 20,
    color: BROWN,
    textAlign: 'right',
  },

  /* Design card */
  designCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  lastDesignCard: {
    marginBottom: 0,
  },
  designCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  designTitleContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  designIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E9D5FF',
  },
  designCardTitle: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    fontSize: 16,
    color: BROWN,
    flex: 1,
    textAlign: 'right',
  },
  designDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  designCardBody: {
    flexDirection: 'row-reverse',
    gap: 16,
    alignItems: 'flex-start',
  },
  designImageContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  designImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 92, 246, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  zoomText: {
    color: WHITE,
    fontSize: 14,
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'center',
  },
  designCardDetails: {
    flex: 1,
    gap: 16,
    justifyContent: 'space-between',
  },
  designInfo: {
    gap: 12,
  },
  designStatus: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontFamily: 'NotoSansArabic_600SemiBold',
    fontSize: 14,
    color: '#10B981',
    textAlign: 'right',
  },
  designDescription: {
    fontFamily: 'NotoSansArabic_500Medium',
    fontSize: 14,
    color: BROWN,
    opacity: 0.8,
    lineHeight: 20,
  },
  designMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  designCategory: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  designCategoryText: {
    fontFamily: 'NotoSansArabic_600SemiBold',
    fontSize: 12,
    color: '#10B981',
  },
  designDate: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  designDateText: {
    fontFamily: 'NotoSansArabic_500Medium',
    fontSize: 12,
    color: GRAY,
  },
  designActionBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 8,
  },
  designActionText: {
    color: WHITE,
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 14,
    textAlign: 'right',
  },

  /* Empty + footer */
  emptyBox: { 
    padding: 40, 
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyText: { 
    color: GRAY, 
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WHITE,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  totalLabel: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
    color: BROWN,
  },
  totalAmount: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    fontSize: 18,
    color: BROWN,
  },
  footer: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    bottom: 0, 
    padding: 16, 
    backgroundColor: 'rgba(245, 245, 245, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  buttonsContainer: { 
    flexDirection: 'row', 
    gap: 12,
    paddingTop: 8,
  },
  appointmentBtn: { 
    backgroundColor: YELLOW, 
    borderRadius: 16, 
    height: 56, 
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row', 
    gap: 10,
    borderWidth: 2,
    borderColor: BROWN,
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  appointmentText: { 
    color: BROWN, 
    fontFamily: 'NotoSansArabic_800ExtraBold', 
    fontSize: 16,
    textAlign: 'right',
  },
  checkoutBtn: { backgroundColor: BROWN, borderRadius: 12, height: 56, flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  checkoutText: { color: WHITE, fontFamily: 'NotoSansArabic_800ExtraBold', fontSize: 16 },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: WHITE,
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    fontSize: 18,
    color: BROWN,
    flex: 1,
     
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImageContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  modalImage: {
    width: screenWidth - 80,
    height: Math.min(screenHeight * 0.4, 400),
    borderRadius: 12,
  },
  modalDescription: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalDescriptionText: {
    fontFamily: 'NotoSansArabic_500Medium',
    fontSize: 16,
    color: BROWN,
    lineHeight: 24,
    textAlign: 'right',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  modalEditBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalEditText: {
    color: WHITE,
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
  },

  /* Loading and Error States */
  loadingContainer: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: 0,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'NotoSansArabic_500Medium',
    color: BROWN,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    fontFamily: 'NotoSansArabic_500Medium',
    color: '#EF4444',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: BROWN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: WHITE,
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
  },

  /* Unauthenticated State */
  unauthenticatedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  unauthenticatedTitle: {
    fontSize: 24,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    color: BROWN,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  unauthenticatedText: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_500Medium',
    color: GRAY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: BROWN,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: BROWN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: WHITE,
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
  },


  /* Skeleton Styles */
  skeletonContainer: {
    flex: 1,
    padding: 16,
    width: '100%',
  },
  skeletonHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  skeletonItems: {
    marginBottom: 20,
  },
  skeletonCard: {
    backgroundColor: YELLOW,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3dcae',
  },
  skeletonCardBody: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 15,
    marginTop: 8,
  },
  skeletonCardDetails: {
    flex: 1,
    gap: 8,
  },
  skeletonActions: {
    gap: 12,
  },
});
