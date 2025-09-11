import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CanvasElement {
  id: string;
  type: 'text' | 'logo' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  data: any;
}

export default function PhotoEditor() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [draggedElement, setDraggedElement] = useState<string | null>(null);

  // Load design image from route parameters
  useEffect(() => {
    if (params.designImage) {
      console.log('Loading design image from params:', params.designImage);
      setSelectedImage(params.designImage as string);
    }
  }, [params.designImage]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إذن الوصول للمكتبة لاختيار الصور');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const addTextElement = () => {
    if (!textInput.trim()) return;
    
    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type: 'text',
      x: 50,
      y: 50,
      width: 200,
      height: 50,
      data: { text: textInput, fontSize, color: textColor },
    };
    
    setCanvasElements(prev => [...prev, newElement]);
    setTextInput('');
    setShowTextModal(false);
  };

  const addLogoElement = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إذن الوصول للمكتبة لاختيار الشعار');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const newElement: CanvasElement = {
        id: Date.now().toString(),
        type: 'logo',
        x: 50,
        y: 100,
        width: 100,
        height: 100,
        data: { imageUri: result.assets[0].uri },
      };
      
      setCanvasElements(prev => [...prev, newElement]);
      setShowLogoModal(false);
    }
  };

  const deleteElement = (id: string) => {
    setCanvasElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const addShape = (shapeType: 'rectangle' | 'circle' | 'triangle') => {
    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type: 'shape',
      x: 50,
      y: 100,
      width: 100,
      height: 100,
      rotation: 0,
      opacity: 0.8,
      data: { 
        shapeType, 
        color: '#FF0000',
        borderColor: '#000000',
        borderWidth: 2
      },
    };
    
    setCanvasElements(prev => [...prev, newElement]);
    setShowShapes(false);
  };

  const updateElementProperty = (id: string, property: string, value: any) => {
    setCanvasElements(prev => prev.map(el => {
      if (el.id === id) {
        if (property === 'rotation' || property === 'opacity') {
          return { ...el, [property]: value };
        } else {
          return { ...el, data: { ...el.data, [property]: value } };
        }
      }
      return el;
    }));
  };

  const duplicateElement = (id: string) => {
    const element = canvasElements.find(el => el.id === id);
    if (element) {
      const newElement: CanvasElement = {
        ...element,
        id: Date.now().toString(),
        x: element.x + 20,
        y: element.y + 20,
      };
      setCanvasElements(prev => [...prev, newElement]);
    }
  };

  const bringToFront = (id: string) => {
    const element = canvasElements.find(el => el.id === id);
    if (element) {
      setCanvasElements(prev => [
        ...prev.filter(el => el.id !== id),
        element
      ]);
    }
  };

  const sendToBack = (id: string) => {
    const element = canvasElements.find(el => el.id === id);
    if (element) {
      setCanvasElements(prev => [
        element,
        ...prev.filter(el => el.id !== id)
      ]);
    }
  };

  const handleDrag = (id: string, gestureEvent: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = gestureEvent.nativeEvent;
    const element = canvasElements.find(el => el.id === id);
    
    if (element) {
      const newX = Math.max(0, Math.min(screenWidth - 40 - element.width, element.x + translationX));
      const newY = Math.max(0, Math.min(screenHeight * 0.5 - element.height, element.y + translationY));
      
      setCanvasElements(prev => prev.map(el => {
        if (el.id === id) {
          return { ...el, x: newX, y: newY };
        }
        return el;
      }));
    }
  };

  const applyTemplate = (template: string) => {
    if (!selectedImage) return;
    
    setCanvasElements([]); // Clear existing elements
    
    switch (template) {
      case 'business':
        setCanvasElements([
          {
            id: '1',
            type: 'text',
            x: 20,
            y: 20,
            width: 200,
            height: 40,
            data: { text: 'اسم الشركة', fontSize: 28, color: '#000000' }
          },
          {
            id: '2',
            type: 'text',
            x: 20,
            y: 60,
            width: 200,
            height: 30,
            data: { text: 'شعار الشركة', fontSize: 20, color: '#666666' }
          }
        ]);
        break;
      case 'event':
        setCanvasElements([
          {
            id: '1',
            type: 'text',
            x: 20,
            y: 20,
            width: 200,
            height: 40,
            data: { text: 'اسم الحدث', fontSize: 32, color: '#FF0000' }
          },
          {
            id: '2',
            type: 'text',
            x: 20,
            y: 60,
            width: 200,
            height: 30,
            data: { text: 'التاريخ والوقت', fontSize: 18, color: '#000000' }
          }
        ]);
        break;
      case 'product':
        setCanvasElements([
          {
            id: '1',
            type: 'text',
            x: 20,
            y: 20,
            width: 200,
            height: 40,
            data: { text: 'اسم المنتج', fontSize: 24, color: '#000000' }
          },
          {
            id: '2',
            type: 'text',
            x: 20,
            y: 60,
            width: 200,
            height: 30,
            data: { text: 'السعر', fontSize: 20, color: '#00AA00' }
          }
        ]);
        break;
    }
    setShowTemplates(false);
  };

  const exportImage = () => {
    if (!selectedImage) {
      Alert.alert('خطأ', 'يرجى اختيار صورة أولاً');
      return;
    }
    
    Alert.alert(
      'تم الحفظ', 
      'تم حفظ التصميم بنجاح!\n\nيمكنك الآن مشاركة التصميم مع المصمم أو طباعته مباشرة.',
      [
        { text: 'موافق', style: 'default' },
        { text: 'مشاركة', style: 'default', onPress: () => {
          Alert.alert('مشاركة', 'سيتم إرسال التصميم للمصمم');
        }}
      ]
    );
  };

  const renderCanvas = () => {
    return (
      <GestureHandlerRootView className="flex-1">
        <View className="flex-1 relative bg-gray-100 rounded-2xl overflow-hidden">
          {/* Background Image with Filter */}
          {selectedImage && (
            <View 
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: selectedFilter === 'none' ? 1 : 0.7,
                filter: selectedFilter !== 'none' ? selectedFilter : 'none'
              }}
            >
              <Image
                source={{ uri: selectedImage }}
                className="w-full h-full"
                resizeMode="cover"
                style={{
                  opacity: selectedFilter === 'none' ? 1 : 0.8
                }}
              />
            </View>
          )}
          
          {/* Canvas Elements */}
          {canvasElements.map((element) => (
            <PanGestureHandler
              key={element.id}
              onGestureEvent={(event: PanGestureHandlerGestureEvent) => handleDrag(element.id, event)}
              onHandlerStateChange={(event: any) => {
                if (event.nativeEvent.state === 5) { // END
                  setDraggedElement(null);
                } else if (event.nativeEvent.state === 2) { // BEGAN
                  setDraggedElement(element.id);
                  setSelectedElement(element.id);
                }
              }}
            >
              <View
                className="absolute items-center justify-center"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  borderWidth: selectedElement === element.id ? 2 : 0,
                  borderColor: selectedElement === element.id ? '#007AFF' : 'transparent',
                  borderStyle: selectedElement === element.id ? 'dashed' : 'solid',
                  transform: [{ rotate: `${element.rotation || 0}deg` }],
                  opacity: element.opacity || 1,
                  zIndex: draggedElement === element.id ? 1000 : 1,
                }}
                onTouchStart={() => setSelectedElement(element.id)}
              >
                {element.type === 'text' && (
                  <Text
                    className="text-center font-[NotoSansArabic_400Regular]"
                    style={{
                      fontSize: element.data.fontSize,
                      color: element.data.color,
                    }}
                  >
                    {element.data.text}
                  </Text>
                )}
                
                {element.type === 'logo' && (
                  <Image
                    source={{ uri: element.data.imageUri }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                )}

                {element.type === 'shape' && (
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: element.data.color,
                      borderColor: element.data.borderColor,
                      borderWidth: element.data.borderWidth,
                      borderRadius: element.data.shapeType === 'circle' ? 50 : 
                                   element.data.shapeType === 'triangle' ? 0 : 8,
                      transform: element.data.shapeType === 'triangle' ? 
                        [{ rotate: '45deg' }] : undefined,
                    }}
                  />
                )}
              </View>
            </PanGestureHandler>
          ))}
        </View>
      </GestureHandlerRootView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color="#2a1e1e" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#2a1e1e] font-[NotoSansArabic_700Bold]">
          محرر الصور
        </Text>
        <TouchableOpacity onPress={exportImage} className="p-2">
          <MaterialIcons name="save" size={24} color="#2a1e1e" />
        </TouchableOpacity>
      </View>

      {/* Canvas Area */}
      <View className="flex-1 m-4">
        {selectedImage ? (
          renderCanvas()
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-100 rounded-2xl">
            <MaterialIcons name="add-photo-alternate" size={80} color="#9CA3AF" />
            <Text className="text-gray-500 text-base font-[NotoSansArabic_500Medium] mt-4 mb-6">
              اختر صورة للبدء
            </Text>
            <TouchableOpacity 
              className="bg-[#2a1e1e] px-6 py-3 rounded-2xl"
              onPress={pickImage}
            >
              <Text className="text-[#ffde9f] text-base font-[NotoSansArabic_600SemiBold]">
                اختيار صورة
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tools Panel */}
      <View className="border-t border-gray-200 py-4">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="px-4"
          contentContainerStyle={{ gap: 16 }}
        >
          <TouchableOpacity 
            className="items-center py-3 px-4 rounded-2xl bg-gray-100 min-w-[80px]"
            onPress={pickImage}
          >
            <MaterialIcons name="photo-library" size={24} color="#2a1e1e" />
            <Text className="text-[#2a1e1e] text-xs font-[NotoSansArabic_500Medium] mt-1">
              صورة
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="items-center py-3 px-4 rounded-2xl bg-gray-100 min-w-[80px]"
            onPress={() => setShowTextModal(true)}
            disabled={!selectedImage}
          >
            <MaterialIcons 
              name="text-fields" 
              size={24} 
              color={selectedImage ? "#2a1e1e" : "#9CA3AF"} 
            />
            <Text 
              className={`text-xs font-[NotoSansArabic_500Medium] mt-1 ${
                selectedImage ? "text-[#2a1e1e]" : "text-gray-400"
              }`}
            >
              نص
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="items-center py-3 px-4 rounded-2xl bg-gray-100 min-w-[80px]"
            onPress={() => setShowLogoModal(true)}
            disabled={!selectedImage}
          >
            <FontAwesome6 
              name="image" 
              size={24} 
              color={selectedImage ? "#2a1e1e" : "#9CA3AF"} 
            />
            <Text 
              className={`text-xs font-[NotoSansArabic_500Medium] mt-1 ${
                selectedImage ? "text-[#2a1e1e]" : "text-gray-400"
              }`}
            >
              شعار
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center py-3 px-4 rounded-2xl bg-purple-100 min-w-[80px]"
            onPress={() => setShowShapes(true)}
            disabled={!selectedImage}
          >
            <MaterialIcons 
              name="category" 
              size={24} 
              color={selectedImage ? "#8B5CF6" : "#9CA3AF"} 
            />
            <Text 
              className={`text-xs font-[NotoSansArabic_500Medium] mt-1 ${
                selectedImage ? "text-[#8B5CF6]" : "text-gray-400"
              }`}
            >
              أشكال
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="items-center py-3 px-4 rounded-2xl bg-orange-100 min-w-[80px]"
            onPress={() => setShowFilters(true)}
            disabled={!selectedImage}
          >
            <MaterialIcons 
              name="filter-vintage" 
              size={24} 
              color={selectedImage ? "#F97316" : "#9CA3AF"} 
            />
            <Text 
              className={`text-xs font-[NotoSansArabic_500Medium] mt-1 ${
                selectedImage ? "text-[#F97316]" : "text-gray-400"
              }`}
            >
              مرشحات
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="items-center py-3 px-4 rounded-2xl bg-green-100 min-w-[80px]"
            onPress={() => setShowTemplates(true)}
            disabled={!selectedImage}
          >
            <MaterialIcons 
              name="auto-awesome" 
              size={24} 
              color={selectedImage ? "#059669" : "#9CA3AF"} 
            />
            <Text 
              className={`text-xs font-[NotoSansArabic_500Medium] mt-1 ${
                selectedImage ? "text-[#059669]" : "text-gray-400"
              }`}
            >
              قوالب
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="items-center py-3 px-4 rounded-2xl bg-gray-100 min-w-[80px]"
            onPress={() => selectedElement && deleteElement(selectedElement)}
            disabled={!selectedElement}
          >
            <MaterialIcons 
              name="delete" 
              size={24} 
              color={selectedElement ? "#FF3B30" : "#9CA3AF"} 
            />
            <Text 
              className={`text-xs font-[NotoSansArabic_500Medium] mt-1 ${
                selectedElement ? "text-[#FF3B30]" : "text-gray-400"
              }`}
            >
              حذف
            </Text>
          </TouchableOpacity>

          {/* Element Manipulation Controls */}
          {selectedElement && (
            <>
              <TouchableOpacity 
                className="items-center py-3 px-4 rounded-2xl bg-blue-100 min-w-[80px]"
                onPress={() => duplicateElement(selectedElement)}
              >
                <MaterialIcons name="content-copy" size={24} color="#007AFF" />
                <Text className="text-[#007AFF] text-xs font-[NotoSansArabic_500Medium] mt-1">
                  نسخ
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="items-center py-3 px-4 rounded-2xl bg-blue-100 min-w-[80px]"
                onPress={() => bringToFront(selectedElement)}
              >
                <MaterialIcons name="keyboard-arrow-up" size={24} color="#007AFF" />
                <Text className="text-[#007AFF] text-xs font-[NotoSansArabic_500Medium] mt-1">
                  أمام
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="items-center py-3 px-4 rounded-2xl bg-blue-100 min-w-[80px]"
                onPress={() => sendToBack(selectedElement)}
              >
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#007AFF" />
                <Text className="text-[#007AFF] text-xs font-[NotoSansArabic_500Medium] mt-1">
                  خلف
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="items-center py-3 px-4 rounded-2xl bg-blue-100 min-w-[80px]"
                onPress={() => updateElementProperty(selectedElement, 'rotation', 
                  (canvasElements.find(el => el.id === selectedElement)?.rotation || 0) + 15)}
              >
                <MaterialIcons name="rotate-right" size={24} color="#007AFF" />
                <Text className="text-[#007AFF] text-xs font-[NotoSansArabic_500Medium] mt-1">
                  دوران
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      {/* Text Input Modal */}
      <Modal visible={showTextModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 w-[90%] max-w-md">
            <Text className="text-lg font-bold text-[#2a1e1e] font-[NotoSansArabic_700Bold] text-center mb-6">
              إضافة نص
            </Text>
            
            <TextInput
              className="border border-gray-300 rounded-xl p-4 text-base font-[NotoSansArabic_400Regular] text-[#2a1e1e] text-right min-h-[100px]"
              value={textInput}
              onChangeText={setTextInput}
              placeholder="اكتب النص هنا..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            
            {/* Font Size Control */}
            <View className="flex-row items-center justify-between my-4">
              <Text className="text-sm font-[NotoSansArabic_500Medium] text-[#2a1e1e]">
                حجم الخط:
              </Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity 
                  className="w-8 h-8 rounded-full bg-[#2a1e1e] items-center justify-center"
                  onPress={() => setFontSize(Math.max(12, fontSize - 2))}
                >
                  <Text className="text-[#ffde9f] text-lg font-[NotoSansArabic_700Bold]">-</Text>
                </TouchableOpacity>
                <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e] min-w-[30px] text-center">
                  {fontSize}
                </Text>
                <TouchableOpacity 
                  className="w-8 h-8 rounded-full bg-[#2a1e1e] items-center justify-center"
                  onPress={() => setFontSize(Math.min(48, fontSize + 2))}
                >
                  <Text className="text-[#ffde9f] text-lg font-[NotoSansArabic_700Bold]">+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Color Picker */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-sm font-[NotoSansArabic_500Medium] text-[#2a1e1e]">
                لون النص:
              </Text>
              <View className="flex-row gap-2">
                {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      textColor === color ? 'border-[#2a1e1e] border-[3px]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onPress={() => setTextColor(color)}
                  />
                ))}
              </View>
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl bg-gray-100"
                onPress={() => setShowTextModal(false)}
              >
                <Text className="text-base font-[NotoSansArabic_600SemiBold] text-gray-500 text-center">
                  إلغاء
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl bg-[#2a1e1e]"
                onPress={addTextElement}
              >
                <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#ffde9f] text-center">
                  إضافة
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logo Upload Modal */}
      <Modal visible={showLogoModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 w-[90%] max-w-md">
            <Text className="text-lg font-bold text-[#2a1e1e] font-[NotoSansArabic_700Bold] text-center mb-6">
              إضافة شعار
            </Text>
            
            <TouchableOpacity 
              className="items-center py-12 bg-gray-100 rounded-xl mb-6 border-2 border-dashed border-gray-300"
              onPress={addLogoElement}
            >
              <MaterialIcons name="add-photo-alternate" size={40} color="#2a1e1e" />
              <Text className="text-sm font-[NotoSansArabic_500Medium] text-[#2a1e1e] mt-2">
                اختيار شعار
              </Text>
            </TouchableOpacity>
            
            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl bg-gray-100"
                onPress={() => setShowLogoModal(false)}
              >
                <Text className="text-base font-[NotoSansArabic_600SemiBold] text-gray-500 text-center">
                  إلغاء
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Templates Modal */}
      <Modal visible={showTemplates} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-6 w-[90%] max-w-md">
            <Text className="text-lg font-bold text-[#2a1e1e] font-[NotoSansArabic_700Bold] text-center mb-6">
              اختر قالب
            </Text>
            
            <View className="space-y-4">
              <TouchableOpacity 
                className="flex-row items-center p-4 bg-blue-50 rounded-xl border border-blue-200"
                onPress={() => applyTemplate('business')}
              >
                <View className="w-12 h-12 bg-blue-500 rounded-lg items-center justify-center mr-4">
                  <MaterialIcons name="business" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e]">
                    قالب شركة
                  </Text>
                  <Text className="text-sm font-[NotoSansArabic_400Regular] text-gray-600">
                    اسم الشركة + شعار
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-row items-center p-4 bg-red-50 rounded-xl border border-red-200"
                onPress={() => applyTemplate('event')}
              >
                <View className="w-12 h-12 bg-red-500 rounded-lg items-center justify-center mr-4">
                  <MaterialIcons name="event" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e]">
                    قالب حدث
                  </Text>
                  <Text className="text-sm font-[NotoSansArabic_400Regular] text-gray-600">
                    اسم الحدث + التاريخ
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-row items-center p-4 bg-green-50 rounded-xl border border-green-200"
                onPress={() => applyTemplate('product')}
              >
                <View className="w-12 h-12 bg-green-500 rounded-lg items-center justify-center mr-4">
                  <MaterialIcons name="inventory" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e]">
                    قالب منتج
                  </Text>
                  <Text className="text-sm font-[NotoSansArabic_400Regular] text-gray-600">
                    اسم المنتج + السعر
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl bg-gray-100"
                onPress={() => setShowTemplates(false)}
              >
                <Text className="text-base font-[NotoSansArabic_600SemiBold] text-gray-500 text-center">
                  إلغاء
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shapes Modal */}
      <Modal visible={showShapes} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-[NotoSansArabic_700Bold] text-[#2a1e1e] mb-6 text-center">
              إضافة أشكال
            </Text>
            
            <View className="space-y-4">
              <TouchableOpacity 
                className="flex-row items-center p-4 bg-red-50 rounded-xl border border-red-200"
                onPress={() => addShape('rectangle')}
              >
                <View className="w-12 h-12 bg-red-500 rounded-lg items-center justify-center mr-4">
                  <View className="w-8 h-6 bg-white rounded" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e]">
                    مستطيل
                  </Text>
                  <Text className="text-sm font-[NotoSansArabic_400Regular] text-gray-600">
                    شكل مستطيل ملون
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-row items-center p-4 bg-blue-50 rounded-xl border border-blue-200"
                onPress={() => addShape('circle')}
              >
                <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
                  <View className="w-8 h-8 bg-white rounded-full" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e]">
                    دائرة
                  </Text>
                  <Text className="text-sm font-[NotoSansArabic_400Regular] text-gray-600">
                    شكل دائري ملون
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-row items-center p-4 bg-green-50 rounded-xl border border-green-200"
                onPress={() => addShape('triangle')}
              >
                <View className="w-12 h-12 bg-green-500 rounded-lg items-center justify-center mr-4">
                  <View className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e]">
                    مثلث
                  </Text>
                  <Text className="text-sm font-[NotoSansArabic_400Regular] text-gray-600">
                    شكل مثلث ملون
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl bg-gray-100"
                onPress={() => setShowShapes(false)}
              >
                <Text className="text-base font-[NotoSansArabic_600SemiBold] text-gray-500 text-center">
                  إلغاء
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Filters Modal */}
      <Modal visible={showFilters} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-[NotoSansArabic_700Bold] text-[#2a1e1e] mb-6 text-center">
              مرشحات الصورة
            </Text>
            
            <View className="space-y-4">
              <TouchableOpacity 
                className={`flex-row items-center p-4 rounded-xl border ${
                  selectedFilter === 'none' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => setSelectedFilter('none')}
              >
                <View className={`w-12 h-12 rounded-lg items-center justify-center mr-4 ${
                  selectedFilter === 'none' ? 'bg-blue-500' : 'bg-gray-400'
                }`}>
                  <MaterialIcons name="image" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e]">
                    بدون مرشح
                  </Text>
                  <Text className="text-sm font-[NotoSansArabic_400Regular] text-gray-600">
                    الصورة الأصلية
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-row items-center p-4 rounded-xl border ${
                  selectedFilter === 'sepia' ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => setSelectedFilter('sepia')}
              >
                <View className={`w-12 h-12 rounded-lg items-center justify-center mr-4 ${
                  selectedFilter === 'sepia' ? 'bg-orange-500' : 'bg-gray-400'
                }`}>
                  <MaterialIcons name="filter-vintage" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e]">
                    مرشح سيبيا
                  </Text>
                  <Text className="text-sm font-[NotoSansArabic_400Regular] text-gray-600">
                    تأثير قديم بني
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className={`flex-row items-center p-4 rounded-xl border ${
                  selectedFilter === 'grayscale' ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200'
                }`}
                onPress={() => setSelectedFilter('grayscale')}
              >
                <View className={`w-12 h-12 rounded-lg items-center justify-center mr-4 ${
                  selectedFilter === 'grayscale' ? 'bg-gray-600' : 'bg-gray-400'
                }`}>
                  <MaterialIcons name="filter-b-and-w" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-[NotoSansArabic_600SemiBold] text-[#2a1e1e]">
                    أبيض وأسود
                  </Text>
                  <Text className="text-sm font-[NotoSansArabic_400Regular] text-gray-600">
                    تحويل إلى تدرج رمادي
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity 
                className="flex-1 py-3 rounded-xl bg-gray-100"
                onPress={() => setShowFilters(false)}
              >
                <Text className="text-base font-[NotoSansArabic_600SemiBold] text-gray-500 text-center">
                  إلغاء
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}