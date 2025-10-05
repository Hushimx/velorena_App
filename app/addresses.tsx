import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { 
  Alert, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  RefreshControl
} from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { getAddresses, deleteAddress, setDefaultAddress, Address } from '../utils/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import AddressFormBottomSheet from '../components/AddressFormBottomSheet';

export default function AddressesScreen() {
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  
  // Bottom sheet refs
  const addressFormBottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const result = await getAddresses();
      setAddresses(result);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل العناوين');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  const handleAddNew = () => {
    setEditingAddressId(null);
    addressFormBottomSheetRef.current?.present();
  };

  const handleEdit = (address: Address) => {
    setEditingAddressId(address.id);
    addressFormBottomSheetRef.current?.present();
  };

  const handleAddressFormSuccess = (address: Address) => {
    // Refresh addresses list
    loadAddresses();
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'حذف العنوان',
      'هل أنت متأكد من حذف هذا العنوان؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(parseInt(id));
              await loadAddresses();
              Alert.alert('نجح', 'تم حذف العنوان بنجاح');
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'فشل حذف العنوان');
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(parseInt(id));
      await loadAddresses();
      Alert.alert('نجح', 'تم تعيين العنوان كافتراضي');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تعيين العنوان الافتراضي');
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor="#FFFFFF">
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.primary} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>عناويني</Text>
              <Text style={styles.headerSubtitle}>
                {addresses.length} عنوان محفوظ{addresses.length !== 1 ? 'ات' : ''}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNew}
          >
            <MaterialIcons name="add" size={22} color={BRAND_COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Addresses List */}
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <MaterialIcons name="location-off" size={80} color={BRAND_COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد عناوين محفوظة</Text>
              <Text style={styles.emptySubtitle}>
                أضف عناوين التسليم لتسريع عملية الطلب
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleAddNew}
              >
                <MaterialIcons name="add-circle-outline" size={20} color={BRAND_COLORS.white} />
                <Text style={styles.emptyButtonText}>إضافة عنوان</Text>
              </TouchableOpacity>
            </View>
          ) : (
            addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressLabelContainer}>
                    <MaterialIcons 
                      name="location-on" 
                      size={20} 
                      color={BRAND_COLORS.primary} 
                    />
                    <Text style={styles.addressLabel}>
                      {address.name || 'عنوان'}
                    </Text>
                    {address.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>افتراضي</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(address)}
                    >
                      <MaterialIcons name="edit" size={18} color={BRAND_COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(address.id.toString())}
                    >
                      <MaterialIcons name="delete-outline" size={18} color={BRAND_COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.addressBody}>
                  <Text style={styles.addressName}>{address.contact_name}</Text>
                  <Text style={styles.addressPhone}>{address.contact_phone}</Text>
                  <Text style={styles.addressText}>{address.address_line}</Text>
                  <Text style={styles.addressCity}>
                    {address.district && `${address.district}, `}
                    {address.city}
                  </Text>
                </View>

                {!address.is_default && (
                  <TouchableOpacity
                    style={styles.setDefaultButton}
                    onPress={() => handleSetDefault(address.id.toString())}
                  >
                    <MaterialIcons name="check-circle-outline" size={18} color={BRAND_COLORS.primary} />
                    <Text style={styles.setDefaultText}>تعيين كافتراضي</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Address Form Bottom Sheet */}
      <AddressFormBottomSheet
        bottomSheetRef={addressFormBottomSheetRef}
        addressId={editingAddressId}
        onSuccess={handleAddressFormSuccess}
      />

    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.tertiary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: BRAND_COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  addressCard: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginLeft: SPACING.sm,
  },
  defaultBadge: {
    backgroundColor: `${BRAND_COLORS.success}15`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: SPACING.sm,
  },
  defaultText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.success,
  },
  addressActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressBody: {
    marginBottom: SPACING.md,
  },
  addressName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  addressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  addressCity: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  setDefaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border.primary,
    paddingTop: SPACING.md,
  },
  setDefaultText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.primary,
    marginLeft: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['6xl'],
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${BRAND_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: BRAND_COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginLeft: SPACING.sm,
  },
});
