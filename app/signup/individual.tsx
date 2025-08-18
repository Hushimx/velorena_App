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
 
export default function IndividualSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    logo: '',
    dateOfBirth: '',
    freelanceDocument: '',
    termsAccepted: false,
  });
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [uploadedFiles, setUploadedFiles] = useState({
    logo: null as any,
    freelanceDocument: null as any,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTermsToggle = () => {
    setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }));
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
  };

  const handleFileUpload = async (field: 'logo' | 'freelanceDocument') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: field === 'logo' ? ['image/*'] : ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets[0]) {
        setUploadedFiles(prev => ({ ...prev, [field]: result.assets[0] }));
        setFormData(prev => ({ ...prev, [field]: result.assets[0].name }));
      }
    } catch (error) {
      console.log('Error picking document:', error);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setFormData(prev => ({ ...prev, dateOfBirth: formattedDate }));
    }
  };

  const showDatePickerModal = () => {
    setTempDate(selectedDate);
    setShowDatePicker(true);
  };

  const confirmDateSelection = () => {
    setSelectedDate(tempDate);
    const formattedDate = tempDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setFormData(prev => ({ ...prev, dateOfBirth: formattedDate }));
    setShowDatePicker(false);
  };

  const cancelDateSelection = () => {
    setShowDatePicker(false);
  };

  const changeYear = (increment: number) => {
    setTempDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(prev.getFullYear() + increment);
      return newDate;
    });
  };

  const changeMonth = (increment: number) => {
    setTempDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + increment);
      return newDate;
    });
  };

  const changeDay = (increment: number) => {
    setTempDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + increment);
      return newDate;
    });
  };

  const handleCreateAccount = () => {
    // Basic validation
    if (!formData.name || !formData.mobileNumber || !formData.email || 
        !formData.password || !formData.confirmPassword || !formData.address || 
        !formData.dateOfBirth || !formData.termsAccepted) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة والموافقة على الشروط');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return;
    }

    // Here you would typically submit the form data
    Alert.alert('نجح', 'تم إنشاء الحساب بنجاح', [
      { text: 'حسناً', onPress: () => router.push('/') }
    ]);
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
          <Text style={styles.headerTitle}>تسجيل كفرد</Text>
          <View style={styles.statusBar} />
        </View>

        {/* Form Sheet */}
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>الاسم</Text>
                <MaterialIcons name="person" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#E9C318" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="الاسم"
                  placeholderTextColor="#E9C318"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
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
                onPress={() => handleFileUpload('logo')}
              >
                <MaterialIcons name="cloud-upload" size={24} color={TEAL_600} />
                <Text style={styles.uploadText}>
                  {uploadedFiles.logo ? uploadedFiles.logo.name : 'تحميل صورة'}
                </Text>
              </TouchableOpacity>
            </View>

                         {/* Date of Birth */}
             <View style={styles.inputGroup}>
               <View style={styles.labelContainer}>
                 <Text style={styles.label}>تاريخ الميلاد</Text>
                 <MaterialIcons name="event" size={20} color={TEAL_600} />
               </View>
               <TouchableOpacity 
                 style={styles.dateInputContainer}
                 onPress={showDatePickerModal}
               >
                 <MaterialIcons name="event" size={20} color="#E9C318" style={styles.inputIcon} />
                 <Text style={[
                   styles.dateInputText,
                   !formData.dateOfBirth && styles.dateInputPlaceholder
                 ]}>
                   {formData.dateOfBirth || 'تاريخ الميلاد'}
                 </Text>
                 <MaterialIcons name="calendar-today" size={20} color={TEAL_600} />
               </TouchableOpacity>
             </View>

            {/* Freelance Document */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>وثيقة عمل حر (اختياري)</Text>
                <MaterialIcons name="description" size={20} color={TEAL_600} />
              </View>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => handleFileUpload('freelanceDocument')}
              >
                <MaterialIcons name="cloud-upload" size={24} color={TEAL_600} />
                <Text style={styles.uploadText}>
                  {uploadedFiles.freelanceDocument ? uploadedFiles.freelanceDocument.name : 'ملف JPG-PNG-PDF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={handleTermsToggle}
              >
                <View style={[styles.checkbox, formData.termsAccepted && styles.checkboxChecked]}>
                  {formData.termsAccepted && (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.termsText}>الموافقة على الشروط والاحكام</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.termsLink}>
                <Text style={styles.termsLinkText}>
                  للتعرف على الشروط و الأحكام اضغط
                </Text>
              </TouchableOpacity>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccount}>
              <Text style={styles.createAccountButtonText}>انشاء حساب</Text>
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

               {/* Custom Date Picker Modal */}
        {showDatePicker && (
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerModal}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>اختر تاريخ الميلاد</Text>
                <TouchableOpacity onPress={cancelDateSelection}>
                  <MaterialIcons name="close" size={24} color="#E9C318" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerContent}>
                {/* Year Selection */}
                <View style={styles.datePickerRow}>
                  <Text style={styles.datePickerLabel}>السنة</Text>
                  <View style={styles.datePickerControls}>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => changeYear(-1)}
                    >
                      <MaterialIcons name="remove" size={20} color={TEAL_600} />
                    </TouchableOpacity>
                    <Text style={styles.datePickerValue}>{tempDate.getFullYear()}</Text>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => changeYear(1)}
                    >
                      <MaterialIcons name="add" size={20} color={TEAL_600} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Month Selection */}
                <View style={styles.datePickerRow}>
                  <Text style={styles.datePickerLabel}>الشهر</Text>
                  <View style={styles.datePickerControls}>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => changeMonth(-1)}
                    >
                      <MaterialIcons name="remove" size={20} color={TEAL_600} />
                    </TouchableOpacity>
                    <Text style={styles.datePickerValue}>
                      {tempDate.toLocaleDateString('ar-SA', { month: 'long' })}
                    </Text>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => changeMonth(1)}
                    >
                      <MaterialIcons name="add" size={20} color={TEAL_600} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Day Selection */}
                <View style={styles.datePickerRow}>
                  <Text style={styles.datePickerLabel}>اليوم</Text>
                  <View style={styles.datePickerControls}>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => changeDay(-1)}
                    >
                      <MaterialIcons name="remove" size={20} color={TEAL_600} />
                    </TouchableOpacity>
                    <Text style={styles.datePickerValue}>{tempDate.getDate()}</Text>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => changeDay(1)}
                    >
                      <MaterialIcons name="add" size={20} color={TEAL_600} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.datePickerFooter}>
                <TouchableOpacity 
                  style={styles.datePickerCancelButton}
                  onPress={cancelDateSelection}
                >
                  <Text style={styles.datePickerCancelText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.datePickerConfirmButton}
                  onPress={confirmDateSelection}
                >
                  <Text style={styles.datePickerConfirmText}>تأكيد</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
  termsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: TEAL_600,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: TEAL_600,
  },
  termsText: {
    fontSize: 16,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: '#374151',
    textAlign: 'right',
    flex: 1,
  },
  termsLink: {
    marginLeft: 36,
  },
  termsLinkText: {
    fontSize: 14,
    color: TEAL_600,
    textDecorationLine: 'underline',
    textAlign: 'right',
  },
  createAccountButton: {
    backgroundColor: TEAL_600,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  createAccountButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'NotoSansArabic_700Bold',
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
   dateInputContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     borderWidth: 1,
     borderColor: TEAL_600,
     borderRadius: 12,
     paddingHorizontal: 16,
     paddingVertical: 12,
     backgroundColor: '#fff',
   },
   dateInputText: {
     flex: 1,
     fontSize: 16,
     color: '#374151',
     textAlign: 'right',
   },
   dateInputPlaceholder: {
     color: '#E9C318',
   },
   datePickerOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0, 0, 0, 0.5)',
     justifyContent: 'center',
     alignItems: 'center',
     zIndex: 1000,
   },
   datePickerModal: {
     backgroundColor: '#fff',
     borderRadius: 16,
     padding: 20,
     width: '90%',
     maxWidth: 400,
   },
   datePickerHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 20,
     paddingBottom: 16,
     borderBottomWidth: 1,
     borderBottomColor: '#E5E7EB',
   },
   datePickerTitle: {
     fontSize: 18,
     fontFamily: 'NotoSansArabic_600SemiBold',
     color: '#374151',
     textAlign: 'center',
     flex: 1,
   },
   datePickerContent: {
     marginBottom: 20,
   },
   datePickerRow: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 16,
   },
   datePickerLabel: {
     fontSize: 16,
     fontFamily: 'NotoSansArabic_500Medium',
     color: '#374151',
     textAlign: 'right',
     flex: 1,
   },
   datePickerControls: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 2,
   },
   datePickerButton: {
     width: 40,
     height: 40,
     borderRadius: 20,
     backgroundColor: '#F3F4F6',
     alignItems: 'center',
     justifyContent: 'center',
     marginHorizontal: 8,
   },
   datePickerValue: {
     fontSize: 18,
     fontFamily: 'NotoSansArabic_600SemiBold',
     color: '#374151',
     textAlign: 'center',
     flex: 1,
     minWidth: 80,
   },
   datePickerFooter: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     gap: 12,
   },
   datePickerCancelButton: {
     flex: 1,
     paddingVertical: 12,
     paddingHorizontal: 16,
     borderRadius: 8,
     borderWidth: 1,
     borderColor: '#D1D5DB',
     backgroundColor: '#fff',
     alignItems: 'center',
     justifyContent: 'center',
   },
   datePickerCancelText: {
     fontSize: 16,
     fontFamily: 'NotoSansArabic_500Medium',
     color: '#6B7280',
   },
   datePickerConfirmButton: {
     flex: 1,
     paddingVertical: 12,
     paddingHorizontal: 16,
     borderRadius: 8,
     backgroundColor: TEAL_600,
     alignItems: 'center',
     justifyContent: 'center',
   },
   datePickerConfirmText: {
     fontSize: 16,
     fontFamily: 'NotoSansArabic_500Medium',
     color: '#fff',
   },
 });
