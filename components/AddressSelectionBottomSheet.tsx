import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { Address, getAddresses, setDefaultAddress } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';

interface AddressSelectionBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  onAddressSelected: (address: Address) => void;
  selectedAddressId?: number;
  showCloseButton?: boolean;
}

const AddressSelectionBottomSheet = forwardRef<BottomSheetModal, AddressSelectionBottomSheetProps>(({
  bottomSheetRef,
  onAddressSelected,
  selectedAddressId,
  showCloseButton = true,
}, ref) => {
  const router = useRouter();
  const snapPoints = useMemo(() => ['70%', '90%'], []);
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load addresses when sheet opens
  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAddresses();
      setAddresses(result);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل العناوين');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load addresses when sheet opens
  useEffect(() => {
    if (bottomSheetRef.current?.snapToIndex !== undefined) {
      loadAddresses();
    }
  }, [loadAddresses]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        onPress={() => bottomSheetRef.current?.dismiss()}
      />
    ),
    [bottomSheetRef]
  );

  const handleAddressSelect = async (address: Address) => {
    try {
      // Set as default if it's not already
      if (!address.is_default) {
        await setDefaultAddress(address.id);
      }
      
      onAddressSelected(address);
      bottomSheetRef.current?.dismiss();
    } catch (error: any) {
      Alert.alert('خطأ', 'فشل في تحديد العنوان');
    }
  };

  const handleAddNewAddress = () => {
    bottomSheetRef.current?.dismiss();
    router.push('/address-form');
  };

  const handleManageAddresses = () => {
    bottomSheetRef.current?.dismiss();
    router.push('/addresses');
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>اختر عنوان التسليم</Text>
          {showCloseButton && (
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.dismiss()}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={BRAND_COLORS.text.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" color={BRAND_COLORS.primary} />
              <Text style={styles.loadingText}>جاري تحميل العناوين...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={48} color={BRAND_COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadAddresses}
              >
                <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
              </TouchableOpacity>
            </View>
          ) : addresses.length > 0 ? (
            <>
              {/* Address List */}
              <View style={styles.addressList}>
                {addresses.map((address) => (
                  <TouchableOpacity
                    key={address.id}
                    style={[
                      styles.addressCard,
                      selectedAddressId === address.id && styles.addressCardSelected
                    ]}
                    onPress={() => handleAddressSelect(address)}
                  >
                    <View style={styles.addressHeader}>
                      <View style={styles.addressInfo}>
                        <Text style={styles.addressName}>
                          {address.name || 'عنوان'}
                        </Text>
                        {address.is_default && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>افتراضي</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.radioCircle}>
                        {selectedAddressId === address.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.addressDetails}>
                      <View style={styles.contactRow}>
                        <MaterialIcons name="person" size={16} color={BRAND_COLORS.gray[500]} />
                        <Text style={styles.contactText}>{address.contact_name}</Text>
                      </View>
                      <View style={styles.contactRow}>
                        <MaterialIcons name="phone" size={16} color={BRAND_COLORS.gray[500]} />
                        <Text style={styles.contactText}>{address.contact_phone}</Text>
                      </View>
                      <View style={styles.contactRow}>
                        <MaterialIcons name="location-on" size={16} color={BRAND_COLORS.gray[500]} />
                        <Text style={styles.addressText} numberOfLines={2}>
                          {address.address_line}
                          {address.district && `, ${address.district}`}
                          {address.city && `, ${address.city}`}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={handleAddNewAddress}
                >
                  <MaterialIcons name="add-circle-outline" size={20} color={BRAND_COLORS.primary} />
                  <Text style={styles.addAddressButtonText}>إضافة عنوان جديد</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={handleManageAddresses}
                >
                  <MaterialIcons name="settings" size={20} color={BRAND_COLORS.gray[600]} />
                  <Text style={styles.manageButtonText}>إدارة العناوين</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* No Addresses State */
            <View style={styles.emptyContainer}>
              <MaterialIcons name="location-off" size={64} color={BRAND_COLORS.gray[400]} />
              <Text style={styles.emptyTitle}>لا توجد عناوين محفوظة</Text>
              <Text style={styles.emptyMessage}>
                أضف عنواناً جديداً لتسهيل عملية التسليم
              </Text>
              
              <TouchableOpacity
                style={styles.addFirstAddressButton}
                onPress={handleAddNewAddress}
              >
                <MaterialIcons name="add" size={20} color={BRAND_COLORS.white} />
                <Text style={styles.addFirstAddressButtonText}>إضافة عنوان</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

AddressSelectionBottomSheet.displayName = 'AddressSelectionBottomSheet';

export default AddressSelectionBottomSheet;

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: BRAND_COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: BRAND_COLORS.gray[300],
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[200],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.error,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: BRAND_COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  addressList: {
    flex: 1,
    gap: SPACING.sm,
  },
  addressCard: {
    backgroundColor: BRAND_COLORS.gray[50],
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[200],
  },
  addressCardSelected: {
    borderColor: BRAND_COLORS.primary,
    borderWidth: 2,
    backgroundColor: BRAND_COLORS.primary + '10',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  addressInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  addressName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  defaultBadge: {
    backgroundColor: BRAND_COLORS.warning,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: BRAND_COLORS.white,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BRAND_COLORS.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BRAND_COLORS.primary,
  },
  addressDetails: {
    gap: SPACING.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  contactText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  addressText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.gray[700],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    flex: 1,
  },
  buttonContainer: {
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.gray[200],
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: BRAND_COLORS.primary,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addAddressButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.primary,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: BRAND_COLORS.gray[100],
    borderRadius: 12,
  },
  manageButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.gray[600],
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING['2xl'],
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.gray[600],
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    paddingHorizontal: SPACING.lg,
  },
  addFirstAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  addFirstAddressButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.white,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
});

