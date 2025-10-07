import { MaterialIcons } from '@expo/vector-icons';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { Address, createAddress, CreateAddressPayload, getAddress, updateAddress } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';

interface AddressFormBottomSheetProps {
  addressId?: number | null;
  onSuccess?: (address: Address) => void;
  showCloseButton?: boolean;
}

export interface AddressFormBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

const AddressFormBottomSheet = forwardRef<AddressFormBottomSheetRef, AddressFormBottomSheetProps>(({
  addressId = null,
  onSuccess,
  showCloseButton = true,
}, ref) => {
  const isEditing = !!addressId;

  console.log('AddressFormBottomSheet rendered');
  console.log('isEditing:', isEditing, 'addressId:', addressId);

  // Form state
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [houseDescription, setHouseDescription] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Expose present/dismiss methods to parent
  useImperativeHandle(ref, () => ({
    present: () => {
      console.log('Modal present called');
      setModalVisible(true);
    },
    dismiss: () => {
      console.log('Modal dismiss called');
      setModalVisible(false);
    },
  }));

  const loadAddress = useCallback(async () => {
    if (!addressId) return;

    setLoading(true);
    try {
      const address = await getAddress(addressId);
      setCity(address.city || '');
      setDistrict(address.district || '');
      setStreet(address.street || '');
      setHouseDescription(address.house_description || '');
      setPostalCode(address.postal_code || '');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل العنوان');
      setModalVisible(false);
    } finally {
      setLoading(false);
    }
  }, [addressId]);

  // Load address data when editing
  useEffect(() => {
    if (isEditing && addressId) {
      loadAddress();
    } else {
      // Reset form for new address
      setCity('');
      setDistrict('');
      setStreet('');
      setHouseDescription('');
      setPostalCode('');
    }
  }, [isEditing, addressId, loadAddress]);

  const validateForm = () => {
    if (!city.trim()) {
      Alert.alert('خطأ', 'المدينة مطلوبة');
      return false;
    }

    if (!district.trim()) {
      Alert.alert('خطأ', 'الحي مطلوب');
      return false;
    }

    if (!street.trim()) {
      Alert.alert('خطأ', 'الشارع مطلوب');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Get user data from auth store
      const { useAuthStore } = await import('../store/useAuthStore');
      const user = useAuthStore.getState().user;
      
      if (!user) {
        Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
        return;
      }

      const payload: CreateAddressPayload = {
        contact_name: user.full_name || 'العميل',
        contact_phone: user.phone || '',
        city: city.trim(),
        district: district.trim(),
        street: street.trim(),
        house_description: houseDescription.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        country: 'Saudi Arabia',
        is_default: false,
      };

      console.log('Saving address with payload:', payload);

      let result;
      if (isEditing && addressId) {
        result = await updateAddress(addressId, payload);
        Alert.alert('نجح', 'تم تحديث العنوان بنجاح');
      } else {
        result = await createAddress(payload);
        Alert.alert('نجح', 'تم إضافة العنوان بنجاح');
      }

      console.log('Address saved successfully:', result);

      // Call success callback if provided
      if (onSuccess && result) {
        onSuccess(result);
      }

      // Close modal
      setModalVisible(false);
    } catch (error: any) {
      console.error('Error saving address:', error);
      Alert.alert('خطأ', error.message || 'فشل حفظ العنوان');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loadingText}>جاري تحميل العنوان...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        console.log('Modal onRequestClose called');
        setModalVisible(false);
      }}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'تعديل العنوان' : 'إضافة عنوان جديد'}
          </Text>
          {showCloseButton && (
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color={BRAND_COLORS.text.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Form Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* City Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>المدينة *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: الرياض"
              value={city}
              onChangeText={setCity}
              textAlign="right"
              returnKeyType="next"
            />
          </View>

          {/* District Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الحي *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: النخيل"
              value={district}
              onChangeText={setDistrict}
              textAlign="right"
              returnKeyType="next"
            />
          </View>

          {/* Street Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الشارع *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: شارع الملك فهد"
              value={street}
              onChangeText={setStreet}
              textAlign="right"
              returnKeyType="next"
            />
          </View>

          {/* House Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>وصف البيت (اختياري)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="مثال: فيلا بيضاء، بجوار المسجد"
              value={houseDescription}
              onChangeText={setHouseDescription}
              textAlign="right"
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
            />
          </View>

          {/* Postal Code Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الرمز البريدي (اختياري)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="مثال: 12345"
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="number-pad"
              textAlign="right"
              maxLength={10}
              returnKeyType="done"
            />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <MaterialIcons name="info" size={20} color={BRAND_COLORS.primary} />
            <Text style={styles.instructionsText}>
              املأ جميع الحقول المطلوبة (*) ثم اضغط على زر &quot;حفظ العنوان&quot;
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons - Fixed Position */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <LoadingSpinner size="small" color="white" />
            ) : (
              <MaterialIcons name="save" size={22} color="white" />
            )}
            <Text style={styles.saveButtonText}>
              {saving 
                ? (isEditing ? 'جاري الحفظ...' : 'جاري الإضافة...') 
                : (isEditing ? 'حفظ التغييرات' : 'حفظ العنوان')
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={18} color={BRAND_COLORS.text.secondary} />
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

AddressFormBottomSheet.displayName = 'AddressFormBottomSheet';

export default AddressFormBottomSheet;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[200],
    backgroundColor: BRAND_COLORS.white,
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
  loadingContainer: {
    backgroundColor: BRAND_COLORS.white,
    padding: SPACING['2xl'],
    borderRadius: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.primary,
    marginTop: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  inputGroup: {
    gap: SPACING.sm,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.primary,
    backgroundColor: BRAND_COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  countryCodeContainer: {
    backgroundColor: BRAND_COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[300],
    minHeight: 48,
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.primary,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  phoneInput: {
    flex: 1,
  },
  phoneHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  textArea: {
    minHeight: 80,
    paddingTop: SPACING.md,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BRAND_COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  instructionsText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'right',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
    backgroundColor: BRAND_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.gray[200],
    position: 'relative',
    zIndex: 10,
  },
  saveButton: {
    flex: 2,
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    minHeight: 52,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: BRAND_COLORS.gray[400],
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: BRAND_COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.gray[100],
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[300],
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  cancelButtonText: {
    color: BRAND_COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
});
