import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '../store/useCartStore';
import { uploadReadyDesignDirect } from '../utils/api';

const YELLOW = '#ffde9f';
const BROWN = '#2a1e1e';
const WHITE = '#ffffff';
const GRAY = '#9CA3AF';

const { width: screenWidth } = Dimensions.get('window');

export default function UploadDesignScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const loadCartDesigns = useCartStore((s) => s.loadCartDesigns);

  const handleBackNavigation = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(tabs)');
      }
    } catch (error) {
      router.push('/(tabs)');
    }
  };

  const pickImages = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'الإذن مطلوب',
          'نحتاج إذن الوصول للمعرض لاختيار صور التصاميم',
          [{ text: 'موافق' }]
        );
        return;
      }

      // Pick multiple images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 10, // Allow up to 10 images
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في اختيار الصور. حاول مرة أخرى');
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'الإذن مطلوب',
          'نحتاج إذن الوصول للكاميرا لالتقاط صورة التصميم',
          [{ text: 'موافق' }]
        );
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في التقاط الصورة. حاول مرة أخرى');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setSelectedImages([]);
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('خطأ', 'يرجى اختيار صورة واحدة على الأقل');
      return;
    }

    if (selectedImages.length > 10) {
      Alert.alert('خطأ', 'يمكن رفع 10 صور كحد أقصى في المرة الواحدة');
      return;
    }

    setUploading(true);

    try {
      
      // Use image URIs directly with React Native FormData
      const formData = new FormData();
      
      selectedImages.forEach((imageUri, index) => {
        
        // React Native FormData expects objects with uri, type, and name properties
        formData.append('design_files[]', {
          uri: imageUri,
          type: 'image/jpeg', // Default to jpeg
          name: `design_${index + 1}.jpg`,
        } as any);
      });

      
      // Upload designs using the direct FormData approach
      const result = await uploadReadyDesignDirect(formData);

      if (result.success) {
        const count = result.uploaded_count || result.data?.length || selectedImages.length;
        const message = count > 1 
          ? `تم رفع ${count} تصميمات وحفظها في السلة بنجاح!`
          : 'تم رفع التصميم وحفظه في السلة بنجاح!';

        // Refresh cart designs to show the uploaded designs
        await loadCartDesigns();

        Alert.alert(
          'تم الرفع بنجاح!',
          message,
          [
            {
              text: 'موافق',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        throw new Error(result.message || 'فشل في رفع التصاميم');
      }
    } catch (error: any) {
      
      let errorMessage = 'فشل في رفع التصاميم. حاول مرة أخرى';
      
      if (error.message?.includes('Property \'blob\' doesn\'t exist')) {
        errorMessage = 'خطأ في معالجة الملفات. تأكد من أن الصور صحيحة وحاول مرة أخرى.';
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'خطأ في تحميل الصور. تأكد من صحة الملفات.';
      } else if (error.message?.includes('Network')) {
        errorMessage = 'خطأ في الاتصال. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'خطأ في الرفع',
        errorMessage
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.iconButton}>
          <MaterialIcons name="arrow-back" size={22} color={BROWN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>رفع تصميم جاهز</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Selection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>اختر صور التصاميم</Text>
            {selectedImages.length > 0 && (
              <TouchableOpacity
                onPress={clearAllImages}
                style={styles.clearAllBtn}
                activeOpacity={0.7}
              >
                <MaterialIcons name="clear-all" size={16} color="#EF4444" />
                <Text style={styles.clearAllText}>مسح الكل</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {selectedImages.length > 0 ? (
            <View style={styles.imagesGrid}>
              {selectedImages.map((imageUri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={styles.removeImageBtn}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="close" size={16} color={WHITE} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="cloud-upload" size={48} color={GRAY} />
              <Text style={styles.placeholderText}>لم يتم اختيار أي صور بعد</Text>
              <Text style={styles.placeholderSubtext}>يمكنك اختيار حتى 10 صور</Text>
            </View>
          )}

          <View style={styles.imageButtons}>
            <TouchableOpacity
              onPress={pickImages}
              style={[styles.imageBtn, styles.galleryBtn]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="photo-library" size={20} color={WHITE} />
              <Text style={styles.imageBtnText}>من المعرض</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={takePhoto}
              style={[styles.imageBtn, styles.cameraBtn]}
              activeOpacity={0.8}
            >
              <MaterialIcons name="camera-alt" size={20} color={WHITE} />
              <Text style={styles.imageBtnText}>التقاط صورة</Text>
            </TouchableOpacity>
          </View>

          {selectedImages.length > 0 && (
            <Text style={styles.selectedCount}>
              تم اختيار {selectedImages.length} صورة
            </Text>
          )}
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadBtn,
            (selectedImages.length === 0 || uploading) && styles.uploadBtnDisabled
          ]}
          onPress={handleUpload}
          activeOpacity={0.8}
          disabled={selectedImages.length === 0 || uploading}
        >
          <MaterialIcons 
            name={uploading ? "hourglass-empty" : "cloud-upload"} 
            size={20} 
            color={WHITE} 
          />
          <Text style={styles.uploadBtnText}>
            {uploading ? 'جاري الرفع...' : `رفع ${selectedImages.length} تصميم`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'NotoSansArabic_800ExtraBold',
    fontSize: 20,
    color: BROWN,
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },

  content: {
    padding: 16,
    paddingBottom: 100,
  },

  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 18,
    color: BROWN,
    textAlign: 'right',
    flex: 1,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearAllText: {
    fontSize: 12,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: '#EF4444',
  },

  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    width: (screenWidth - 48) / 2, // 2 columns with gap
  },
  selectedImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: WHITE,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    height: 200,
    borderRadius: 12,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: 'NotoSansArabic_500Medium',
    color: GRAY,
    textAlign: 'center',
  },
  placeholderSubtext: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'NotoSansArabic_400Regular',
    color: GRAY,
    textAlign: 'center',
  },
  selectedCount: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'NotoSansArabic_600SemiBold',
    color: BROWN,
    textAlign: 'center',
  },

  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  galleryBtn: {
    backgroundColor: '#8B5CF6',
  },
  cameraBtn: {
    backgroundColor: '#059669',
  },
  imageBtnText: {
    color: WHITE,
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
  },


  uploadBtn: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  uploadBtnDisabled: {
    backgroundColor: GRAY,
    opacity: 0.6,
  },
  uploadBtnText: {
    color: WHITE,
    fontFamily: 'NotoSansArabic_800ExtraBold',
    fontSize: 18,
  },
});
