import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import CountryPicker, { Country } from 'react-native-country-picker-modal';

// Function to convert country code to flag emoji
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};
 
export default function CompanySignupStep1() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    logo: '',
  });
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  };

  const handleLogoUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets[0]) {
        setFormData(prev => ({ ...prev, logo: result.assets[0].name }));
      }
    } catch (error) {
      console.log('Error picking document:', error);
    }
  };

  const handleNext = () => {
    // Basic validation
    if (!formData.companyName || !formData.mobileNumber || !formData.email || 
        !formData.password || !formData.confirmPassword || !formData.address) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return;
    }

    // Navigate to step 2
    router.push('/signup/company-step2');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={24} color="#000000FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تسجيل كشركة</Text>
          <View style={styles.statusBar} />
        </View>

        {/* Form Sheet */}
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Company Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>اسم الشركة</Text>
                <MaterialIcons name="business" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="business" size={20} color="#E9C318" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="اسم الشركة"
                  placeholderTextColor="#E9C318"
                  value={formData.companyName}
                  onChangeText={(value) => handleInputChange('companyName', value)}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>رقم الجوال</Text>
                <MaterialIcons name="phone" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                                 <TouchableOpacity 
                   style={styles.countrySelector}
                   onPress={() => setShowCountryPicker(true)}
                 >
                   <Text style={styles.countryFlag}>
                     {selectedCountry ? getFlagEmoji(selectedCountry.cca2) : '🏳️'}
                   </Text>
                   <Text style={styles.countryCode}>+{selectedCountry?.callingCode?.[0] || '966'}</Text>
                   <MaterialIcons name="keyboard-arrow-down" size={20} color="#E9C318" />
                 </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="ادخل رقم الجوال"
                  placeholderTextColor="#E9C318"
                  value={formData.mobileNumber}
                  onChangeText={(value) => handleInputChange('mobileNumber', value)}
                  keyboardType="phone-pad"
                  textAlign="right"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>البريد الالكتروني ( للتواصل البديل و الفواتير)</Text>
                <MaterialIcons name="email" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#E9C318" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="البريد الالكتروني"
                  placeholderTextColor="#E9C318"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  textAlign="right"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>كلمة المرور</Text>
                <MaterialIcons name="lock" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIconContainer}
                >
                  <MaterialIcons 
                    name={showPassword ? "visibility" : "visibility-off"} 
                    size={20} 
                    color="#E9C318" 
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="ادخل كلمة المرور"
                  placeholderTextColor="#E9C318"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>تأكيد كلمة المرور</Text>
                <MaterialIcons name="lock" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIconContainer}
                >
                  <MaterialIcons 
                    name={showConfirmPassword ? "visibility" : "visibility-off"} 
                    size={20} 
                    color="#E9C318" 
                  />
                </TouchableOpacity>
                <TextInput
                  style={styles.input}
                  placeholder="الباسورد"
                  placeholderTextColor="#E9C318"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>العنوان</Text>
                <MaterialIcons name="location-on" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="location-on" size={20} color="#E9C318" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="العنوان (المدينة, الحي, الشارع)"
                  placeholderTextColor="#E9C318"
                  value={formData.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Logo */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>شعار (اختياري)</Text>
              </View>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={handleLogoUpload}
              >
                <MaterialIcons name="cloud-upload" size={24} color={TEAL_600} />
                <Text style={styles.uploadText}>
                  {formData.logo ? formData.logo : 'تحميل صورة'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Next Button */}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>التالي</Text>
              <MaterialIcons name="arrow-back" size={20} color="#fff" style={styles.nextButtonIcon} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Country Picker Modal */}
      <CountryPicker
        withFilter
        withFlag
        withCallingCode
        withEmoji
        withFlagButton
        countryCode={selectedCountry?.cca2 || 'SA'}
        visible={showCountryPicker}
        onSelect={handleCountrySelect}
        onClose={() => setShowCountryPicker(false)}
        translation="common"
        theme={{
          flagSizeButton: 20,
          flagSize: 20,
        }}
      />
    </SafeAreaView>
  );
}

const TEAL_600 = '#E9C318';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TEAL_600,
  },
  container: {
    flex: 1,
    backgroundColor: TEAL_600,
  },
  header: {
    height: '25%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'NotoSansArabic_700Bold',
    textAlign: 'center',
    flex: 1,
  },
  statusBar: {
    width: 40,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  content: {
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: '#374151',
    textAlign: 'right',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: TEAL_600,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    textAlign: 'right',
  },
  nextButton: {
    backgroundColor: TEAL_600,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NotoSansArabic_700Bold',
    marginRight: 8,
  },
  nextButtonIcon: {
    transform: [{ rotate: '180deg' }],
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    marginRight: 12,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    color: '#374151',
    marginRight: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TEAL_600,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    color: TEAL_600,
    marginLeft: 12,
    textAlign: 'center',
  },
  eyeIconContainer: {
    padding: 8,
    marginRight: 8,
  },
});
