import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { LoadingSpinner } from '../components/LoadingSpinner';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function SelectLocationScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
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
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Loading states
  const [locationLoading, setLocationLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        // If permission denied, just show default location
        setInitialLoading(false);
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setInitialLoading(false);
    }
  };

  const getCurrentLocation = async () => {
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
      console.error('Error getting current location:', error);
      Alert.alert('خطأ', 'فشل الحصول على الموقع الحالي');
    } finally {
      setLocationLoading(false);
      setInitialLoading(false);
    }
  };

  // Get address from coordinates using reverse geocoding

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
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
        
        setSelectedAddress(fullAddress);
        return fullAddress;
      }
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
    }
    return null;
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

  const handleMapRegionChangeComplete = (region: any) => {
    // Get address from coordinates when region change is complete
    getAddressFromCoordinates(region.latitude, region.longitude);
  };

  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(false);
    
    try {
      console.log('Searching for:', query);
      
      // Try multiple search strategies
      let allResults: any[] = [];
      
      // 1. Search with Saudi Arabia context
      try {
        const saudiQuery = `${query}, Saudi Arabia`;
        console.log('Trying geocoding with Saudi context:', saudiQuery);
        const saudiResults = await Location.geocodeAsync(saudiQuery);
        if (saudiResults && saudiResults.length > 0) {
          allResults = [...allResults, ...saudiResults];
        }
      } catch (error) {
        console.log('Saudi context search failed:', error);
      }
      
      // 2. Search with Arabic context
      try {
        const arabicQuery = `${query}, المملكة العربية السعودية`;
        console.log('Trying geocoding with Arabic context:', arabicQuery);
        const arabicResults = await Location.geocodeAsync(arabicQuery);
        if (arabicResults && arabicResults.length > 0) {
          allResults = [...allResults, ...arabicResults];
        }
      } catch (error) {
        console.log('Arabic context search failed:', error);
      }
      
      // 3. Search without context
      try {
        console.log('Trying geocoding without context:', query);
        const globalResults = await Location.geocodeAsync(query);
        if (globalResults && globalResults.length > 0) {
          allResults = [...allResults, ...globalResults];
        }
      } catch (error) {
        console.log('Global search failed:', error);
      }
      
      // 4. Search with city-specific contexts
      const cities = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الخبر', 'الظهران'];
      for (const city of cities) {
        try {
          const cityQuery = `${query}, ${city}, السعودية`;
          console.log('Trying geocoding with city context:', cityQuery);
          const cityResults = await Location.geocodeAsync(cityQuery);
          if (cityResults && cityResults.length > 0) {
            allResults = [...allResults, ...cityResults];
          }
        } catch (error) {
          console.log(`City search for ${city} failed:`, error);
        }
      }
      
      console.log('All geocoding results:', allResults);
      
      if (allResults.length > 0) {
        // Remove duplicates based on coordinates
        const uniqueResults = allResults.filter((result, index, self) => 
          index === self.findIndex(r => 
            r.latitude === result.latitude && r.longitude === result.longitude
          )
        );
        
        const formattedResults = uniqueResults.map((result, index) => {
          // Build a more descriptive address
          let addressParts = [];
          if (result.streetNumber) addressParts.push(result.streetNumber);
          if (result.street) addressParts.push(result.street);
          if (result.district) addressParts.push(result.district);
          if (result.city) addressParts.push(result.city);
          if (result.region) addressParts.push(result.region);
          if (result.country) addressParts.push(result.country);
          
          const fullAddress = addressParts.length > 0 
            ? addressParts.join(', ')
            : `${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`;
          
          return {
            id: index,
            latitude: result.latitude,
            longitude: result.longitude,
            name: query,
            address: fullAddress,
            fullAddress: fullAddress,
            isLocal: false,
          };
        });
        
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
    
    // Update map region with animation
    const newRegion = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    
    console.log('Setting new map region:', newRegion);
    setMapRegion(newRegion);
    
    // Force map update using ref
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
    
    // Get address from coordinates
    getAddressFromCoordinates(result.latitude, result.longitude);
    
    // Clear search
    setSearchQuery('');
    setShowSearchResults(false);
    
    console.log('Selected location:', result.name, 'at', result.latitude, result.longitude);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleContinue = () => {
    if (!latitude || !longitude) {
      Alert.alert('خطأ', 'يجب تحديد الموقع على الخريطة أولاً');
      return;
    }

    // Navigate to address form with location data
    router.push({
      pathname: '/address-form',
      params: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address: selectedAddress,
      }
    });
  };

  if (initialLoading) {
    return (
      <SafeAreaWrapper backgroundColor="#FFFFFF">
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" color={BRAND_COLORS.primary} />
          <Text style={styles.loadingText}>جاري تحميل الخريطة...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

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
        <Text style={styles.headerTitle}>اختر موقع التسليم</Text>
        <View style={styles.placeholder} />
      </View>

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
                name="location-on" 
                size={20} 
                color={BRAND_COLORS.primary} 
              />
              <View style={styles.searchResultText}>
                <Text style={styles.searchResultName}>{result.name}</Text>
                <Text style={styles.searchResultAddress}>{result.fullAddress || result.address}</Text>
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
          onRegionChange={handleMapRegionChange}
          onRegionChangeComplete={handleMapRegionChangeComplete}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          mapType="standard"
          showsCompass={false}
          showsScale={false}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={true}
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

      {/* Selected Location Info */}
      {selectedAddress && (
        <View style={styles.selectedLocationContainer}>
          <MaterialIcons name="location-on" size={20} color={BRAND_COLORS.success} />
          <View style={styles.selectedLocationText}>
            <Text style={styles.selectedLocationTitle}>الموقع المحدد:</Text>
            <Text style={styles.selectedLocationAddress}>{selectedAddress}</Text>
          </View>
        </View>
      )}

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!latitude || !longitude) && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!latitude || !longitude}
        >
          <MaterialIcons name="arrow-forward" size={22} color="white" />
          <Text style={styles.continueButtonText}>متابعة</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: BRAND_COLORS.text.secondary,
    marginTop: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.white,
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[300],
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.gray[300],
    marginHorizontal: SPACING.lg,
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
  noResultsContainer: {
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: BRAND_COLORS.gray[50],
    borderRadius: 12,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
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
    flex: 1,
    marginHorizontal: SPACING.lg,
    borderRadius: 12,
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
    borderRadius: 8,
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
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.success + '10',
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  selectedLocationText: {
    flex: 1,
  },
  selectedLocationTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.success,
    marginBottom: 2,
  },
  selectedLocationAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
  },
  buttonContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: BRAND_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.gray[200],
  },
  continueButton: {
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
  continueButtonDisabled: {
    backgroundColor: BRAND_COLORS.gray[400],
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: BRAND_COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
});
