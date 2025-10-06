import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { Address, createAddress, CreateAddressPayload, getAddress, updateAddress } from '../utils/api';
import { LoadingSpinner } from './LoadingSpinner';

// Enable maps for both development and production
const MAPS_ENABLED = true;

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
    console.warn('Maps module not available:', error);
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

const { width: screenWidth } = Dimensions.get('window');

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

  // Use the ref passed from parent or the internal ref
  const modalRef = ref || bottomSheetRef;

  console.log('AddressFormBottomSheet rendered, modalRef:', modalRef);
  console.log('isEditing:', isEditing, 'addressId:', addressId);

  // Monitor modalRef changes to show/hide modal
  useEffect(() => {
    if (modalRef.current) {
      // Modal is ready, we can control it
      console.log('Modal ref is ready');
    }
  }, [modalRef]);

  // Expose methods to parent component
  React.useImperativeHandle(modalRef, () => ({
    present: () => {
      console.log('Modal present called');
      setModalVisible(true);
    },
    dismiss: () => {
      console.log('Modal dismiss called');
      setModalVisible(false);
    },
  }));

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCityName, setSelectedCityName] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<any>(null);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
      return;
    }
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
    }
  };

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      if (!Location) return;
      
      console.log('Getting address for coordinates:', lat, lng);
      const results = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      
      if (results && results.length > 0) {
        const result = results[0];
        console.log('Reverse geocoding result:', result);
        
        // Build address string
        let addressParts = [];
        
        if (result.street) addressParts.push(result.street);
        if (result.district) addressParts.push(result.district);
        if (result.city) addressParts.push(result.city);
        if (result.region) addressParts.push(result.region);
        
        const fullAddress = addressParts.join(', ');
        console.log('Generated address:', fullAddress);
        
        setAddress(fullAddress);
        return fullAddress;
      }
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
    }
    return null;
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
      
      // Get address from coordinates
      await getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
    } catch (error) {
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
    
    // Get address from coordinates
    getAddressFromCoordinates(latitude, longitude);
  };

  const handleMapRegionChange = (region: any) => {
    setMapRegion(region);
    // Update coordinates when map region changes (for center dot)
    setLatitude(region.latitude);
    setLongitude(region.longitude);
  };

  const searchLocation = async (query: string) => {
    if (!Location || !query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(false);
    
    try {
      console.log('Searching for:', query);
      
      // Comprehensive Saudi cities mapping with coordinates
      const saudiCities: { [key: string]: { name: string; lat: number; lng: number; region: string } } = {
        // Riyadh Region
        'الري': { name: 'الرياض', lat: 24.7136, lng: 46.6753, region: 'منطقة الرياض' },
        'الريا': { name: 'الرياض', lat: 24.7136, lng: 46.6753, region: 'منطقة الرياض' },
        'الرياض': { name: 'الرياض', lat: 24.7136, lng: 46.6753, region: 'منطقة الرياض' },
        'riyadh': { name: 'الرياض', lat: 24.7136, lng: 46.6753, region: 'منطقة الرياض' },
        'الطائف': { name: 'الطائف', lat: 21.2703, lng: 40.4158, region: 'منطقة مكة المكرمة' },
        'بريدة': { name: 'بريدة', lat: 26.3260, lng: 43.9750, region: 'منطقة القصيم' },
        'عنيزة': { name: 'عنيزة', lat: 26.0907, lng: 43.9880, region: 'منطقة القصيم' },
        'الزلفي': { name: 'الزلفي', lat: 26.2994, lng: 44.8150, region: 'منطقة الرياض' },
        'الدرعية': { name: 'الدرعية', lat: 24.7319, lng: 46.5700, region: 'منطقة الرياض' },
        'الخرج': { name: 'الخرج', lat: 24.1556, lng: 47.3056, region: 'منطقة الرياض' },
        'الدوادمي': { name: 'الدوادمي', lat: 24.5072, lng: 44.3928, region: 'منطقة الرياض' },
        'الغاط': { name: 'الغاط', lat: 26.3333, lng: 45.0000, region: 'منطقة الرياض' },
        'حوطة بني تميم': { name: 'حوطة بني تميم', lat: 23.5000, lng: 46.3333, region: 'منطقة الرياض' },
        'المزاحمية': { name: 'المزاحمية', lat: 24.4667, lng: 46.2500, region: 'منطقة الرياض' },
        'الرمة': { name: 'الرمة', lat: 25.8333, lng: 45.4167, region: 'منطقة الرياض' },
        'الشماسية': { name: 'الشماسية', lat: 25.9167, lng: 45.3333, region: 'منطقة الرياض' },
        'الأفلاج': { name: 'الأفلاج', lat: 22.2833, lng: 46.6667, region: 'منطقة الرياض' },
        'وادي الدواسر': { name: 'وادي الدواسر', lat: 20.4667, lng: 44.8500, region: 'منطقة الرياض' },
        'السليل': { name: 'السليل', lat: 20.5000, lng: 45.5833, region: 'منطقة الرياض' },
        
        // Makkah Region
        'مكة': { name: 'مكة المكرمة', lat: 21.3891, lng: 39.8579, region: 'منطقة مكة المكرمة' },
        'مكه': { name: 'مكة المكرمة', lat: 21.3891, lng: 39.8579, region: 'منطقة مكة المكرمة' },
        'مكة المكرمة': { name: 'مكة المكرمة', lat: 21.3891, lng: 39.8579, region: 'منطقة مكة المكرمة' },
        'المدينة': { name: 'المدينة المنورة', lat: 24.5247, lng: 39.5692, region: 'منطقة المدينة المنورة' },
        'المدينة المنورة': { name: 'المدينة المنورة', lat: 24.5247, lng: 39.5692, region: 'منطقة المدينة المنورة' },
        'جدة': { name: 'جدة', lat: 21.4858, lng: 39.1925, region: 'منطقة مكة المكرمة' },
        'جده': { name: 'جدة', lat: 21.4858, lng: 39.1925, region: 'منطقة مكة المكرمة' },
        'jedda': { name: 'جدة', lat: 21.4858, lng: 39.1925, region: 'منطقة مكة المكرمة' },
        'ينبع': { name: 'ينبع', lat: 24.0897, lng: 38.0618, region: 'منطقة المدينة المنورة' },
        'رابغ': { name: 'رابغ', lat: 22.7984, lng: 39.0349, region: 'منطقة مكة المكرمة' },
        'الليث': { name: 'الليث', lat: 20.1500, lng: 40.2833, region: 'منطقة مكة المكرمة' },
        'القنفذة': { name: 'القنفذة', lat: 19.1167, lng: 41.0833, region: 'منطقة مكة المكرمة' },
        'العلا': { name: 'العلا', lat: 26.6167, lng: 37.9167, region: 'منطقة المدينة المنورة' },
        'خيبر': { name: 'خيبر', lat: 25.1833, lng: 39.3000, region: 'منطقة المدينة المنورة' },
        'بدر': { name: 'بدر', lat: 23.7833, lng: 38.7833, region: 'منطقة المدينة المنورة' },
        'المهد': { name: 'المهد', lat: 23.5000, lng: 40.4167, region: 'منطقة المدينة المنورة' },
        'الحناكية': { name: 'الحناكية', lat: 24.2500, lng: 39.7500, region: 'منطقة المدينة المنورة' },
        'البدائع': { name: 'البدائع', lat: 25.9167, lng: 39.3333, region: 'منطقة المدينة المنورة' },
        
        // Eastern Province
        'الدمام': { name: 'الدمام', lat: 26.4207, lng: 50.0888, region: 'المنطقة الشرقية' },
        'الخبر': { name: 'الخبر', lat: 26.1792, lng: 50.1971, region: 'المنطقة الشرقية' },
        'الظهران': { name: 'الظهران', lat: 26.2361, lng: 50.1971, region: 'المنطقة الشرقية' },
        'القطيف': { name: 'القطيف', lat: 26.5195, lng: 49.9881, region: 'المنطقة الشرقية' },
        'الأحساء': { name: 'الأحساء', lat: 25.4290, lng: 49.6299, region: 'المنطقة الشرقية' },
        'الهفوف': { name: 'الهفوف', lat: 25.3647, lng: 49.5656, region: 'المنطقة الشرقية' },
        'الجبيل': { name: 'الجبيل', lat: 27.0167, lng: 49.6667, region: 'المنطقة الشرقية' },
        'ينبع البحر': { name: 'ينبع البحر', lat: 24.0897, lng: 38.0618, region: 'المنطقة الشرقية' },
        'النعيرية': { name: 'النعيرية', lat: 27.4500, lng: 48.4167, region: 'المنطقة الشرقية' },
        'بقيق': { name: 'بقيق', lat: 25.9333, lng: 49.6667, region: 'المنطقة الشرقية' },
        'العديد': { name: 'العديد', lat: 25.4167, lng: 49.5833, region: 'المنطقة الشرقية' },
        'القرية العليا': { name: 'القرية العليا', lat: 25.5000, lng: 49.5833, region: 'المنطقة الشرقية' },
        'القرية السفلى': { name: 'القرية السفلى', lat: 25.4500, lng: 49.5500, region: 'المنطقة الشرقية' },
        'الخبراء': { name: 'الخبراء', lat: 25.3500, lng: 49.5000, region: 'المنطقة الشرقية' },
        'العيون': { name: 'العيون', lat: 25.3000, lng: 49.4500, region: 'المنطقة الشرقية' },
        'الجفر': { name: 'الجفر', lat: 25.2500, lng: 49.4000, region: 'المنطقة الشرقية' },
        'المنطقة الشرقية': { name: 'الدمام', lat: 26.4207, lng: 50.0888, region: 'المنطقة الشرقية' },
        
        // Northern Borders
        'عرعر': { name: 'عرعر', lat: 30.9753, lng: 41.0381, region: 'منطقة الحدود الشمالية' },
        'رفحاء': { name: 'رفحاء', lat: 29.6264, lng: 43.4944, region: 'منطقة الحدود الشمالية' },
        'طريف': { name: 'طريف', lat: 31.6833, lng: 40.4167, region: 'منطقة الحدود الشمالية' },
        'العويقيلة': { name: 'العويقيلة', lat: 30.5000, lng: 41.0000, region: 'منطقة الحدود الشمالية' },
        
        // Tabuk Region
        'تبوك': { name: 'تبوك', lat: 28.3998, lng: 36.5700, region: 'منطقة تبوك' },
        'الوجه': { name: 'الوجه', lat: 26.2389, lng: 36.4531, region: 'منطقة تبوك' },
        'ضباء': { name: 'ضباء', lat: 27.3519, lng: 35.6900, region: 'منطقة تبوك' },
        'أملج': { name: 'أملج', lat: 25.0333, lng: 37.2667, region: 'منطقة تبوك' },
        'حقل': { name: 'حقل', lat: 29.3000, lng: 34.9500, region: 'منطقة تبوك' },
        'تيماء': { name: 'تيماء', lat: 27.6333, lng: 38.5500, region: 'منطقة تبوك' },
        'البدع': { name: 'البدع', lat: 28.0000, lng: 36.0000, region: 'منطقة تبوك' },
        'الزيتة': { name: 'الزيتة', lat: 28.5000, lng: 36.5000, region: 'منطقة تبوك' },
        
        // Hail Region
        'حائل': { name: 'حائل', lat: 27.5114, lng: 41.6900, region: 'منطقة حائل' },
        'بقعاء': { name: 'بقعاء', lat: 27.3519, lng: 41.6900, region: 'منطقة حائل' },
        'الغزالة': { name: 'الغزالة', lat: 27.7500, lng: 41.5000, region: 'منطقة حائل' },
        'الشنان': { name: 'الشنان', lat: 27.2500, lng: 41.2500, region: 'منطقة حائل' },
        'الشملي': { name: 'الشملي', lat: 27.0000, lng: 41.0000, region: 'منطقة حائل' },
        'موقق': { name: 'موقق', lat: 27.5000, lng: 41.7500, region: 'منطقة حائل' },
        
        // Al Jouf Region
        'سكاكا': { name: 'سكاكا', lat: 29.9697, lng: 40.2064, region: 'منطقة الجوف' },
        'القريات': { name: 'القريات', lat: 31.3314, lng: 37.3428, region: 'منطقة الجوف' },
        'دومة الجندل': { name: 'دومة الجندل', lat: 29.8167, lng: 39.8667, region: 'منطقة الجوف' },
        'طبرجل': { name: 'طبرجل', lat: 30.5000, lng: 38.0000, region: 'منطقة الجوف' },
        'النبك': { name: 'النبك', lat: 30.0000, lng: 40.0000, region: 'منطقة الجوف' },
        
        // Qassim Region
        'القصيم': { name: 'بريدة', lat: 26.3260, lng: 43.9750, region: 'منطقة القصيم' },
        'الرس': { name: 'الرس', lat: 25.8614, lng: 43.4996, region: 'منطقة القصيم' },
        'المذنب': { name: 'المذنب', lat: 25.8667, lng: 44.2000, region: 'منطقة القصيم' },
        'البكيرية': { name: 'البكيرية', lat: 26.1333, lng: 43.6667, region: 'منطقة القصيم' },
        'البدائع': { name: 'البدائع', lat: 25.9167, lng: 44.0000, region: 'منطقة القصيم' },
        'الشماسية': { name: 'الشماسية', lat: 25.9167, lng: 43.3333, region: 'منطقة القصيم' },
        'عيون الجواء': { name: 'عيون الجواء', lat: 26.0833, lng: 43.7500, region: 'منطقة القصيم' },
        'النبهانية': { name: 'النبهانية', lat: 26.0000, lng: 43.5000, region: 'منطقة القصيم' },
        'الأسياح': { name: 'الأسياح', lat: 26.2500, lng: 44.0000, region: 'منطقة القصيم' },
        'الخبراء': { name: 'الخبراء', lat: 25.3500, lng: 43.5000, region: 'منطقة القصيم' },
        
        // Asir Region
        'أبها': { name: 'أبها', lat: 18.2465, lng: 42.5056, region: 'منطقة عسير' },
        'خميس مشيط': { name: 'خميس مشيط', lat: 18.3000, lng: 42.7333, region: 'منطقة عسير' },
        'النماص': { name: 'النماص', lat: 19.1500, lng: 42.1167, region: 'منطقة عسير' },
        'محايل عسير': { name: 'محايل عسير', lat: 18.5000, lng: 42.2500, region: 'منطقة عسير' },
        'محايل': { name: 'محايل عسير', lat: 18.5000, lng: 42.2500, region: 'منطقة عسير' },
        'بيشة': { name: 'بيشة', lat: 20.0000, lng: 42.6000, region: 'منطقة عسير' },
        'تثليث': { name: 'تثليث', lat: 19.5000, lng: 42.0000, region: 'منطقة عسير' },
        'سراة عبيدة': { name: 'سراة عبيدة', lat: 18.7500, lng: 42.5000, region: 'منطقة عسير' },
        'رجال ألمع': { name: 'رجال ألمع', lat: 18.5000, lng: 42.0000, region: 'منطقة عسير' },
        'البرك': { name: 'البرك', lat: 18.0000, lng: 42.0000, region: 'منطقة عسير' },
        'الحرجة': { name: 'الحرجة', lat: 18.2500, lng: 42.2500, region: 'منطقة عسير' },
        'الطرف': { name: 'الطرف', lat: 18.7500, lng: 42.7500, region: 'منطقة عسير' },
        'الخميس': { name: 'الخميس', lat: 18.5000, lng: 42.5000, region: 'منطقة عسير' },
        'الخميس مشيط': { name: 'خميس مشيط', lat: 18.3000, lng: 42.7333, region: 'منطقة عسير' },
        
        // Jazan Region
        'جازان': { name: 'جازان', lat: 16.8892, lng: 42.5511, region: 'منطقة جازان' },
        'صبيا': { name: 'صبيا', lat: 17.1494, lng: 42.6256, region: 'منطقة جازان' },
        'أبو عريش': { name: 'أبو عريش', lat: 16.9667, lng: 42.8333, region: 'منطقة جازان' },
        'صامطة': { name: 'صامطة', lat: 16.9167, lng: 42.7500, region: 'منطقة جازان' },
        'الطوال': { name: 'الطوال', lat: 17.0000, lng: 42.5000, region: 'منطقة جازان' },
        'الدرب': { name: 'الدرب', lat: 17.5000, lng: 42.0000, region: 'منطقة جازان' },
        'الريث': { name: 'الريث', lat: 17.2500, lng: 42.2500, region: 'منطقة جازان' },
        'ضمد': { name: 'ضمد', lat: 17.3333, lng: 42.6667, region: 'منطقة جازان' },
        'الحرث': { name: 'الحرث', lat: 17.0000, lng: 42.0000, region: 'منطقة جازان' },
        'فيفاء': { name: 'فيفاء', lat: 17.5000, lng: 42.5000, region: 'منطقة جازان' },
        'الداير': { name: 'الداير', lat: 17.7500, lng: 42.7500, region: 'منطقة جازان' },
        'العيدابي': { name: 'العيدابي', lat: 17.0000, lng: 42.2500, region: 'منطقة جازان' },
        'العارضة': { name: 'العارضة', lat: 17.2500, lng: 42.5000, region: 'منطقة جازان' },
        
        // Najran Region
        'نجران': { name: 'نجران', lat: 17.4917, lng: 44.1277, region: 'منطقة نجران' },
        'شرورة': { name: 'شرورة', lat: 17.5000, lng: 47.1167, region: 'منطقة نجران' },
        'حبونا': { name: 'حبونا', lat: 17.7500, lng: 44.0000, region: 'منطقة نجران' },
        'بدر الجنوب': { name: 'بدر الجنوب', lat: 17.0000, lng: 44.0000, region: 'منطقة نجران' },
        'الخرخير': { name: 'الخرخير', lat: 17.2500, lng: 44.2500, region: 'منطقة نجران' },
        'يدمة': { name: 'يدمة', lat: 17.5000, lng: 44.5000, region: 'منطقة نجران' },
        'ثار': { name: 'ثار', lat: 17.0000, lng: 44.5000, region: 'منطقة نجران' },
        'الخوبة': { name: 'الخوبة', lat: 17.7500, lng: 44.7500, region: 'منطقة نجران' },
        
        // Al Baha Region
        'الباحة': { name: 'الباحة', lat: 20.0129, lng: 41.4687, region: 'منطقة الباحة' },
        'بلجرشي': { name: 'بلجرشي', lat: 20.0167, lng: 41.4667, region: 'منطقة الباحة' },
        'المندق': { name: 'المندق', lat: 20.2500, lng: 41.2500, region: 'منطقة الباحة' },
        'العقيق': { name: 'العقيق', lat: 20.5000, lng: 41.0000, region: 'منطقة الباحة' },
        'القرى': { name: 'القرى', lat: 20.0000, lng: 41.0000, region: 'منطقة الباحة' },
        'المخواة': { name: 'المخواة', lat: 20.2500, lng: 41.5000, region: 'منطقة الباحة' },
        'قلوة': { name: 'قلوة', lat: 20.0000, lng: 41.7500, region: 'منطقة الباحة' },
        'الحجرة': { name: 'الحجرة', lat: 20.5000, lng: 41.7500, region: 'منطقة الباحة' },
        'الغالة': { name: 'الغالة', lat: 20.7500, lng: 41.5000, region: 'منطقة الباحة' },
        'الزاهر': { name: 'الزاهر', lat: 20.2500, lng: 41.0000, region: 'منطقة الباحة' },
        'الخضراء': { name: 'الخضراء', lat: 20.0000, lng: 41.2500, region: 'منطقة الباحة' },
        'الغامدية': { name: 'الغامدية', lat: 20.5000, lng: 41.2500, region: 'منطقة الباحة' },
        'الزهراء': { name: 'الزهراء', lat: 20.7500, lng: 41.0000, region: 'منطقة الباحة' },
        'الزهرة': { name: 'الزهرة', lat: 20.0000, lng: 41.5000, region: 'منطقة الباحة' },
        'الزهرية': { name: 'الزهرية', lat: 20.2500, lng: 41.7500, region: 'منطقة الباحة' }
      };
      
      // Check if it's a known Saudi city
      const normalizedQuery = query.toLowerCase().trim();
      const cityInfo = saudiCities[normalizedQuery];
      
      if (cityInfo) {
        console.log('Found Saudi city:', cityInfo);
        
        // Create result for known city
        const cityResult = {
          id: 0,
          latitude: cityInfo.lat,
          longitude: cityInfo.lng,
          name: cityInfo.name,
          address: `${cityInfo.name}, ${cityInfo.region}`,
          isKnownCity: true
        };
        
        setSearchResults([cityResult]);
        setShowSearchResults(true);
        
        // Update map to show the city immediately
        const cityRegion = {
          latitude: cityInfo.lat,
          longitude: cityInfo.lng,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
        
        console.log('Updating map region for city:', cityInfo.name, cityRegion);
        setMapRegion(cityRegion);
        
        // Also update coordinates
        setLatitude(cityInfo.lat);
        setLongitude(cityInfo.lng);
        
        // Force map update using ref
        if (mapRef.current) {
          mapRef.current.animateToRegion(cityRegion, 1000);
        }
        
        console.log('Updated map and coordinates for city:', cityInfo.name);
        return;
      }
      
      // For unknown locations, try geocoding
      let results: any[] = [];
      
      // Try with Saudi Arabia context first
      const saudiQuery = `${query}, Saudi Arabia`;
      console.log('Trying geocoding with Saudi context:', saudiQuery);
      results = await Location.geocodeAsync(saudiQuery);
      
      // If no results, try without context
      if (!results || results.length === 0) {
        console.log('Trying geocoding without context:', query);
        results = await Location.geocodeAsync(query);
      }
      
      console.log('Geocoding results:', results);
      
      if (results && results.length > 0) {
        const formattedResults = results.map((result, index) => ({
          id: index,
          latitude: result.latitude,
          longitude: result.longitude,
          name: query,
          address: `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`,
          isKnownCity: false
        }));
        
        console.log('Formatted geocoding results:', formattedResults);
        setSearchResults(formattedResults);
        setShowSearchResults(true);
      } else {
        console.log('No geocoding results found');
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchQueryChange = (text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (text.trim().length > 2) {
      // Add debouncing to avoid too many API calls
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(text);
      }, 500); // Wait 500ms after user stops typing
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const selectSearchResult = (result: any) => {
    console.log('Selecting result:', result);
    
    // Update coordinates first
    setLatitude(result.latitude);
    setLongitude(result.longitude);
    
    // Update selected city name
    setSelectedCityName(result.name);
    
    // Update map region with animation
    const newRegion = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: result.isKnownCity ? 0.1 : 0.01,
      longitudeDelta: result.isKnownCity ? 0.1 : 0.01,
    };
    
    console.log('Setting new map region:', newRegion);
    setMapRegion(newRegion);
    
    // Force map update using ref
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
    
    // Clear search
    setSearchQuery('');
    setShowSearchResults(false);
    
    console.log('Selected location:', result.name, 'at', result.latitude, result.longitude);
    console.log('Current latitude:', result.latitude, 'longitude:', result.longitude);
    console.log('Selected city name:', result.name);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
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

    // Location is required if maps are enabled
    if (MAPS_ENABLED && MapView && (!latitude || !longitude)) {
      Alert.alert('خطأ', 'يجب تحديد الموقع على الخريطة أولاً');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Ensure we have valid coordinates
      if (!latitude || !longitude) {
        Alert.alert('خطأ', 'يجب تحديد الموقع على الخريطة أولاً');
        setSaving(false);
        return;
      }

      // Determine city name based on selected city or coordinates
      let cityName = selectedCityName || 'الرياض'; // Use selected city or default
      
      // If no city selected but we have coordinates, use generic location
      if (!selectedCityName && latitude && longitude) {
        cityName = 'موقع محدد';
      }
      
      // Create detailed address information
      const addressLine = address.trim() || (selectedCityName 
        ? `موقع محدد في ${selectedCityName}`
        : 'موقع محدد على الخريطة');
      
      const payload: CreateAddressPayload = {
        name: name.trim(),
        contact_name: name.trim(),
        contact_phone: `+966${phone.trim()}`,
        address_line: addressLine,
        city: cityName,
        country: 'Saudi Arabia',
        latitude: parseFloat(latitude.toFixed(6)), // Ensure precision
        longitude: parseFloat(longitude.toFixed(6)), // Ensure precision
        is_default: false,
      };

      console.log('Saving address with payload:', payload);
      console.log('Coordinates (precise):', { 
        latitude: parseFloat(latitude.toFixed(6)), 
        longitude: parseFloat(longitude.toFixed(6)) 
      });
      console.log('Selected city:', selectedCityName);
      console.log('Map region:', mapRegion);

      let result;
      if (isEditing && addressId) {
        result = await updateAddress(addressId, payload);
        Alert.alert(
          'نجح', 
          `تم تحديث العنوان بنجاح\nالموقع: ${cityName}\nالإحداثيات: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        );
      } else {
        result = await createAddress(payload);
        Alert.alert(
          'نجح', 
          `تم إضافة العنوان بنجاح\nالموقع: ${cityName}\nالإحداثيات: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        );
      }

      console.log('Address saved successfully:', result);

      // Call success callback if provided
      if (onSuccess && result) {
        onSuccess(result);
      }

      // Close bottom sheet
      modalRef.current?.dismiss();
    } catch (error: any) {
      console.error('Error saving address:', error);
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
        onPress={() => modalRef.current?.dismiss()}
      />
    ),
    [modalRef]
  );

  if (loading) {
    return (
      <BottomSheetModal
        ref={modalRef}
        index={-1}
        snapPoints={['90%']}
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
          {/* Map Section - Only show if MapView is available and maps are enabled */}
          {MAPS_ENABLED && MapView && (
            <View style={styles.mapSection}>
              <Text style={styles.sectionTitle}>اختر موقع التسليم *</Text>
              
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color={BRAND_COLORS.gray[500]} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="ابحث عن موقع..."
                  value={searchQuery}
                  onChangeText={handleSearchQueryChange}
                  textAlign="right"
                  returnKeyType="search"
                />
                {searchLoading && (
                  <LoadingSpinner size="small" color={BRAND_COLORS.primary} />
                )}
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                    <MaterialIcons name="close" size={20} color={BRAND_COLORS.gray[500]} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Search Results */}
              {searchQuery.length > 2 && !searchLoading && searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  {searchResults.map((result) => (
                    <TouchableOpacity
                      key={result.id}
                      style={styles.searchResultItem}
                      onPress={() => selectSearchResult(result)}
                    >
                      <MaterialIcons 
                        name={result.isKnownCity ? "location-city" : "location-on"} 
                        size={20} 
                        color={result.isKnownCity ? BRAND_COLORS.success : BRAND_COLORS.primary} 
                      />
                      <View style={styles.searchResultText}>
                        <Text style={styles.searchResultName}>{result.name}</Text>
                        <Text style={styles.searchResultAddress}>{result.address}</Text>
                        {result.isKnownCity && (
                          <Text style={styles.searchResultRegion}>مدينة سعودية</Text>
                        )}
                      </View>
                      <MaterialIcons name="arrow-forward" size={16} color={BRAND_COLORS.gray[400]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* No Results Message */}
              {!searchLoading && searchQuery.length > 2 && searchResults.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <MaterialIcons name="search-off" size={32} color={BRAND_COLORS.gray[400]} />
                  <Text style={styles.noResultsText}>لم يتم العثور على نتائج</Text>
                  <Text style={styles.noResultsSubtext}>جرب البحث بكلمات مختلفة أو اسم المدينة</Text>
                </View>
              )}

              {/* Map */}
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  region={mapRegion}
                  onRegionChangeComplete={handleMapRegionChange}
                  showsUserLocation={true}
                  showsMyLocationButton={false}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  animateToRegion={mapRegion}
                >
                  {/* Center Dot Indicator */}
                  <View style={styles.centerDotContainer}>
                    <View style={styles.centerDot} />
                  </View>
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
                    حرك الخريطة لتحديد موقع التسليم أو استخدم البحث
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Fallback when MapView is not available or maps are disabled */}
          {(!MAPS_ENABLED || !MapView) && (
            <View style={styles.fallbackContainer}>
              <MaterialIcons name="location-off" size={48} color={BRAND_COLORS.gray[400]} />
              <Text style={styles.fallbackTitle}>الخريطة غير متاحة</Text>
              <Text style={styles.fallbackText}>
                سيتم حفظ العنوان بدون تحديد الموقع الجغرافي
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

          {/* Address Input - Auto-filled from location */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>العنوان التفصيلي</Text>
            <TextInput
              style={[styles.textInput, styles.addressInput]}
              placeholder="سيتم ملء العنوان تلقائياً عند تحديد الموقع..."
              value={address}
              onChangeText={setAddress}
              textAlign="right"
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
            />
            <Text style={styles.addressHint}>
              💡 يمكنك تعديل العنوان أو إضافة تفاصيل إضافية
            </Text>
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

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <MaterialIcons name="info" size={20} color={BRAND_COLORS.primary} />
            <Text style={styles.instructionsText}>
              بعد ملء جميع البيانات وتحديد الموقع، اضغط على زر "إضافة العنوان" لحفظ العنوان
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.white,
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
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
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    paddingVertical: 0,
  },
  clearSearchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultsContainer: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[300],
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[100],
    gap: SPACING.sm,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
  },
  searchResultRegion: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.success,
    marginTop: 2,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: BRAND_COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  noResultsText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.primary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  noResultsSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
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
  centerDotContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -15,
    marginLeft: -15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  centerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BRAND_COLORS.primary,
    borderWidth: 3,
    borderColor: BRAND_COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
  addressInput: {
    minHeight: 80,
    paddingTop: SPACING.md,
  },
  addressHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: BRAND_COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'right',
    marginTop: SPACING.xs,
    fontStyle: 'italic',
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
