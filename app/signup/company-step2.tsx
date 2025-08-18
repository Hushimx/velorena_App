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

export default function CompanySignupStep2() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    activityDescription: '',
    commercialRegister: '',
    taxRegister: '',
    responsibleName: '',
    jobTitle: '',
    termsAccepted: false,
  });
  const [uploadedFiles, setUploadedFiles] = useState({
    commercialRegister: null as any,
    taxRegister: null as any,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTermsToggle = () => {
    setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }));
  };

  const handleFileUpload = async (field: 'commercialRegister' | 'taxRegister') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
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

  const handleCreateAccount = () => {
    // Basic validation
    if (!formData.activityDescription || !formData.commercialRegister || 
        !formData.responsibleName || !formData.termsAccepted) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة والموافقة على الشروط');
      return;
    }

    // Here you would typically submit the form data
    Alert.alert('نجح', 'تم إنشاء الحساب بنجاح', [
      { text: 'حسناً', onPress: () => router.replace('/(tabs)') }
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
          <Text style={styles.headerTitle}>تسجيل كشركة</Text>
          <View style={styles.statusBar} />
        </View>

        {/* Form Sheet */}
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Activity Description */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>وصف مختصر للنشاط</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="اكتب وصف مختصر"
                  placeholderTextColor="#E9C318"
                  value={formData.activityDescription}
                  onChangeText={(value) => handleInputChange('activityDescription', value)}
                  textAlign="right"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Commercial Register */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>السجل التجاري</Text>
                <MaterialIcons name="description" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="رقم السجل التجاري"
                  placeholderTextColor="#E9C318"
                  value={formData.commercialRegister}
                  onChangeText={(value) => handleInputChange('commercialRegister', value)}
                  textAlign="right"
                />
              </View>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => handleFileUpload('commercialRegister')}
              >
                <MaterialIcons name="cloud-upload" size={24} color={TEAL_600} />
                <Text style={styles.uploadText}>
                  {uploadedFiles.commercialRegister ? uploadedFiles.commercialRegister.name : 'رفع نسخة PDF/JPG'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tax Register */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>السجل الضريبي (اختياري)</Text>
                <MaterialIcons name="description" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="رقم السجل الضريبي"
                  placeholderTextColor="#E9C318"
                  value={formData.taxRegister}
                  onChangeText={(value) => handleInputChange('taxRegister', value)}
                  textAlign="right"
                />
              </View>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => handleFileUpload('taxRegister')}
              >
                <MaterialIcons name="cloud-upload" size={24} color={TEAL_600} />
                <Text style={styles.uploadText}>
                  {uploadedFiles.taxRegister ? uploadedFiles.taxRegister.name : 'رفع نسخة PDF/JPG'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Responsible Name */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>اسم المسؤول / الممثل القانوني</Text>
                <MaterialIcons name="person" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#E9C318" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="الاسم / اسم الشركة (حسب نوع الحساب)"
                  placeholderTextColor="#E9C318"
                  value={formData.responsibleName}
                  onChangeText={(value) => handleInputChange('responsibleName', value)}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Job Title */}
            <View style={styles.inputGroup}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>المسمى الوظيفي للمسؤول (اختياري)</Text>
                <MaterialIcons name="person" size={20} color={TEAL_600} />
              </View>
              <View style={styles.inputContainer}>
                <MaterialIcons name="person" size={20} color="#E9C318" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="اكتب المسمى الوظيفي"
                  placeholderTextColor="#E9C318"
                  value={formData.jobTitle}
                  onChangeText={(value) => handleInputChange('jobTitle', value)}
                  textAlign="right"
                />
              </View>
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
                  للتعرف على الشروط والاحكام أضغط هنا
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: TEAL_600,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  uploadText: {
    fontSize: 14,
    color: TEAL_600,
    marginLeft: 8,
    textAlign: 'center',
  },
});
