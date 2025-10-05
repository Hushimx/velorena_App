import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, Platform, ScrollView } from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/Theme';
import { LoadingSpinner } from './LoadingSpinner';
import { createAddress, updateAddress, getAddress, CreateAddressPayload, Address } from '../utils/api';

// Disable maps in development builds to prevent crashes
const isDevelopmentBuild = __DEV__;
const MAPS_ENABLED = !isDevelopmentBuild; // Disable maps in dev builds

// Safe imports with error handling
let MapView: any = null;
let Marker: any = null;
let Location: any = null;
let PROVIDER_GOOGLE: any = null;

if (MAPS_ENABLED) {
  try {
    const MapsModule = require('react-native-maps');
    MapView = MapsModule.default;
    Marker = MapsModule.Marker;
    PROVIDER_GOOGLE = MapsModule.PROVIDER_GOOGLE;
  } catch (error) {
    console.warn('Map components not available:', error);
    MapView = null;
    Marker = null;
    PROVIDER_GOOGLE = null;
  }
}

try {
  Location = require('expo-location');
} catch (error) {
  console.warn('Location module not available:', error);
  Location = null;
}

interface AddressFormBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  addressId?: number | null;
  onSuccess?: (address: Address) => void;
  showCloseButton?: boolean;
}

// Removed unused screenWidth

const AddressFormBottomSheet = forwardRef<BottomSheetModal, AddressFormBottomSheetProps>(({
  bottomSheetRef,
  addressId = null,
  onSuccess,
  showCloseButton = true,
}, ref) => {
  const isEditing = !!addressId;
  const snapPoints = useMemo(() => ['90%', '95%'], []);

  // Fix for iOS bottom sheet display issue
  useEffect(() => {
    if (Platform.OS === 'ios' && bottomSheetRef.current) {
      // Force a small delay to ensure proper rendering on iOS
      const timer = setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [bottomSheetRef]);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Location state
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [mapRegion, setMapRegion] = useState({
    latitude: 24.7136, // Riyadh default
    longitude: 46.6753,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Load address data when editing
  useEffect(() => {
    if (isEditing && addressId) {
      loadAddress();
    } else {
      // Reset form for new address
      setName('');
      setPhone('');
      setLatitude(undefined);
      setLongitude(undefined);
      // Only request location permission if maps are enabled
      if (MAPS_ENABLED) {
        requestLocationPermission();
      }
    }
  }, [isEditing, addressId]);

  const loadAddress = async () => {
    if (!addressId) return;

    setLoading(true);
    try {
      const address = await getAddress(addressId);
      setName(address.name || '');
      setPhone(address.contact_phone || '');
      setLatitude(address.latitude);
      setLongitude(address.longitude);
      
      if (address.latitude && address.longitude) {
        setMapRegion({
          latitude: address.latitude,
          longitude: address.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل العنوان');
      bottomSheetRef.current?.dismiss();
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    if (!Location) {
      console.warn('Location module not available');
      return;
    }
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (!Location) {
      Alert.alert('خطأ', 'خدمة الموقع غير متاحة');
      return;
    }

    setLocationLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setMapRegion(newRegion);
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('خطأ', 'فشل الحصول على الموقع الحالي');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLatitude(latitude);
    setLongitude(longitude);
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
  };

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

    // Make location optional if map is not available or disabled
    if (MAPS_ENABLED && MapView && (!latitude || !longitude)) {
      Alert.alert('خطأ', 'يجب تحديد الموقع على الخريطة');
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
        address_line: 'موقع محدد على الخريطة',
        city: 'الرياض',
        country: 'Saudi Arabia',
        latitude,
        longitude,
        is_default: false,
      };

      let result;
      if (isEditing && addressId) {
        result = await updateAddress(addressId, payload);
        Alert.alert('نجح', 'تم تحديث العنوان بنجاح');
      } else {
        result = await createAddress(payload);
        Alert.alert('نجح', 'تم إضافة العنوان بنجاح');
      }

      // Call success callback if provided
      if (onSuccess && result) {
        onSuccess(result);
      }

      // Close bottom sheet
      bottomSheetRef.current?.dismiss();
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل حفظ العنوان');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        android_keyboardInputMode="adjustResize"
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loadingText}>جاري تحميل العنوان...</Text>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      android_keyboardInputMode="adjustResize"
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'تعديل العنوان' : 'إضافة عنوان جديد'}
          </Text>
          {showCloseButton && (
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.dismiss()}
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
          {/* Map Section - Only show if MapView is available and maps are enabled */}
          {MAPS_ENABLED && MapView && (
            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>اختر موقع التسليم *</Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  region={mapRegion}
                  onPress={handleMapPress}
                  showsUserLocation={true}
                  showsMyLocationButton={false}
                >
                  {latitude && longitude && Marker && (
                    <Marker
                      coordinate={{ latitude, longitude }}
                      title="موقع التسليم"
                      description="انقر على الخريطة لتغيير الموقع"
                    />
                  )}
                </MapView>

                <TouchableOpacity
                  style={styles.locateMeButton}
                  onPress={getCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <LoadingSpinner size="small" color={BRAND_COLORS.primary} />
                  ) : (
                    <MaterialIcons name="my-location" size={24} color={BRAND_COLORS.primary} />
                  )}
                </TouchableOpacity>

                <View style={styles.mapInstruction}>
                  <MaterialIcons name="info" size={16} color={BRAND_COLORS.gray[600]} />
                  <Text style={styles.mapInstructionText}>
                    انقر على الخريطة لتحديد موقع التسليم
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Fallback when MapView is not available or maps are disabled */}
          {(!MAPS_ENABLED || !MapView) && (
            <View style={styles.fallbackContainer}>
              <MaterialIcons name="location-off" size={48} color={BRAND_COLORS.gray[400]} />
              <Text style={styles.fallbackTitle}>
                {isDevelopmentBuild ? 'وضع التطوير' : 'الخريطة غير متاحة'}
              </Text>
              <Text style={styles.fallbackText}>
                {isDevelopmentBuild 
                  ? 'في وضع التطوير، سيتم حفظ العنوان بدون تحديد الموقع الجغرافي'
                  : 'سيتم حفظ العنوان بدون تحديد الموقع الجغرافي'
                }
              </Text>
            </View>
          )}

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الاسم *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="أدخل اسمك الكامل"
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
                textAlign="right"
                maxLength={9}
                returnKeyType="done"
              />
            </View>
            <Text style={styles.phoneHint}>أدخل رقم الهاتف بدون الرمز الدولي</Text>
          </View>

          {/* Location Status - Only show if MapView is available and maps are enabled */}
          {MAPS_ENABLED && MapView && (
            <>
              {latitude && longitude ? (
                <View style={styles.successContainer}>
                  <MaterialIcons name="check-circle" size={20} color={BRAND_COLORS.success} />
                  <Text style={styles.successText}>
                    تم تحديد الموقع بنجاح
                  </Text>
                </View>
              ) : (
                <View style={styles.warningContainer}>
                  <MaterialIcons name="warning" size={20} color={BRAND_COLORS.warning} />
                  <Text style={styles.warningText}>
                    يجب تحديد الموقع على الخريطة
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <LoadingSpinner size="small" color="white" />
            ) : (
              <MaterialIcons name="save" size={20} color="white" />
            )}
            <Text style={styles.saveButtonText}>
              {saving 
                ? (isEditing ? 'جاري الحفظ...' : 'جاري الإضافة...') 
                : (isEditing ? 'حفظ التغييرات' : 'إضافة العنوان')
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => bottomSheetRef.current?.dismiss()}
            activeOpacity={0.8}
          >
            <MaterialIcons name="cancel" size={20} color={BRAND_COLORS.text.secondary} />
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

AddressFormBottomSheet.displayName = 'AddressFormBottomSheet';

export default AddressFormBottomSheet;

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.secondary,
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
  },
  mapSection: {
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    textAlign: 'right',
  },
  mapContainer: {
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[300],
  },
  map: {
    flex: 1,
  },
  locateMeButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: BRAND_COLORS.white,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapInstruction: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 80,
    backgroundColor: BRAND_COLORS.white,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  mapInstructionText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: BRAND_COLORS.gray[600],
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.success + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  successText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.success,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'right',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.warning + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.warning,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    textAlign: 'right',
  },
  fallbackContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: BRAND_COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  fallbackTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  fallbackText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  buttonContainer: {
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  saveButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: BRAND_COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  cancelButton: {
    backgroundColor: BRAND_COLORS.gray[100],
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[300],
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
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
