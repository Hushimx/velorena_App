import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { LoadingSpinner } from '../components/LoadingSpinner';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { createAddress, CreateAddressPayload } from '../utils/api';

export default function AddressFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Location data from previous screen
  const latitude = params.latitude ? parseFloat(params.latitude as string) : undefined;
  const longitude = params.longitude ? parseFloat(params.longitude as string) : undefined;
  const address = params.address as string || '';
  
  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'الاسم مطلوب');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('خطأ', 'رقم الهاتف مطلوب');
      return false;
    }

    // Basic phone validation
    const phoneRegex = /^[0-9]{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      Alert.alert('خطأ', 'رقم الهاتف يجب أن يكون 9 أرقام');
      return false;
    }

    if (!latitude || !longitude) {
      Alert.alert('خطأ', 'يجب تحديد الموقع أولاً');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload: CreateAddressPayload = {
        name: name.trim(),
        contact_name: name.trim(),
        contact_phone: `+966${phone.trim()}`,
        address_line: address || 'موقع محدد على الخريطة',
        city: 'موقع محدد',
        country: 'Saudi Arabia',
        latitude: parseFloat(latitude!.toFixed(6)),
        longitude: parseFloat(longitude!.toFixed(6)),
        is_default: false,
      };

      console.log('Saving address with payload:', payload);

      const result = await createAddress(payload);
      Alert.alert(
        'نجح', 
        `تم إضافة العنوان بنجاح\nالموقع: ${address}\nالإحداثيات: ${latitude!.toFixed(4)}, ${longitude!.toFixed(4)}`
      );

      console.log('Address saved successfully:', result);

      // Navigate back to addresses list
      router.push('/addresses');
    } catch (error: any) {
      console.error('Error saving address:', error);
      Alert.alert('خطأ', error.message || 'فشل حفظ العنوان');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-forward" size={24} color={BRAND_COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>بيانات المستلم</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Info */}
        <View style={styles.locationInfoContainer}>
          <MaterialIcons name="location-on" size={20} color={BRAND_COLORS.primary} />
          <View style={styles.locationInfoText}>
            <Text style={styles.locationInfoTitle}>الموقع المحدد:</Text>
            <Text style={styles.locationInfoAddress}>{address || 'موقع محدد على الخريطة'}</Text>
            {latitude && longitude && (
              <Text style={styles.locationInfoCoords}>
                الإحداثيات: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            )}
          </View>
        </View>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>اسم المستلم *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="أدخل اسم المستلم الكامل"
            value={name}
            onChangeText={setName}
            textAlign="right"
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>رقم الهاتف *</Text>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCodeContainer}>
              <Text style={styles.countryCodeText}>+966</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.phoneInput]}
              placeholder="596000912"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="left"
              maxLength={9}
              returnKeyType="done"
            />
          </View>
          <Text style={styles.phoneHint}>أدخل رقم الهاتف بدون الرمز الدولي</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <MaterialIcons name="info" size={20} color={BRAND_COLORS.primary} />
          <Text style={styles.instructionsText}>
            بعد ملء جميع البيانات، اضغط على زر "حفظ العنوان" لحفظ العنوان
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
            {saving ? 'جاري الحفظ...' : 'حفظ العنوان'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="close" size={18} color={BRAND_COLORS.text.secondary} />
          <Text style={styles.cancelButtonText}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.white,
    writingDirection: 'rtl',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[200],
    backgroundColor: BRAND_COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  locationInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BRAND_COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  locationInfoText: {
    flex: 1,
  },
  locationInfoTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.primary,
    marginBottom: 4,
  },
  locationInfoAddress: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    marginBottom: 2,
    textAlign: 'right',
  },
  locationInfoCoords: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'right',
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
    borderRadius: 12,
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
    borderRadius: 12,
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
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BRAND_COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: 12,
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
  },
  saveButton: {
    flex: 2,
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
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
    borderRadius: 12,
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
