import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import ReanimatedAnimated, {
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useCartStore } from '../store/useCartStore';
import { saveDesign } from '../utils/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CanvasElement {
  id: string;
  type: 'text' | 'logo';
  x: number;
  y: number;
  width: number;
  height: number;
  data: any;
}

const AnimatedTouchableOpacity = ReanimatedAnimated.createAnimatedComponent(TouchableOpacity);

export default function PhotoEditor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const addDesign = useCartStore((s) => s.addDesign);
  
  // State management
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  
  // Bottom sheet refs
  const textBottomSheetRef = useRef<BottomSheetModal>(null);
  const logoBottomSheetRef = useRef<BottomSheetModal>(null);
  
  // Bottom sheet snap points
  const textSnapPoints = useMemo(() => ['65%'], []);
  const logoSnapPoints = useMemo(() => ['55%'], []);
  
  // Text editing states
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(28);

  // Load design image from route parameters
  useEffect(() => {
    console.log('Photo editor params:', params);
    if (params.designImage) {
      console.log('Setting selected image:', params.designImage);
      setSelectedImage(params.designImage as string);
    }
  }, [params]);

  useEffect(() => {
    console.log('🚀 PHOTO EDITOR MOUNTED');
    console.log('🚀 Text ref after mount:', textBottomSheetRef.current);
    console.log('🚀 Logo ref after mount:', logoBottomSheetRef.current);
    
    // Check after a delay to see if refs are set
    setTimeout(() => {
      console.log('🚀 DELAYED CHECK - Text ref:', textBottomSheetRef.current);
      console.log('🚀 DELAYED CHECK - Logo ref:', logoBottomSheetRef.current);
    }, 1000);
  }, []);


  const addTextElement = () => {
    if (!textInput.trim()) return;
    
    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type: 'text',
      x: screenWidth / 2 - 100,
      y: 120,
      width: 200,
      height: 60,
      data: { text: textInput, fontSize, color: textColor },
    };
    
    setCanvasElements(prev => [...prev, newElement]);
    setTextInput('');
    textBottomSheetRef.current?.dismiss();
    setSelectedElement(newElement.id);
  };

  const openTextSheet = () => {
    console.log('🔴 BUTTON PRESSED: Opening text sheet...');
    console.log('🔴 Text ref exists:', !!textBottomSheetRef.current);
    console.log('🔴 Text ref:', textBottomSheetRef.current);
    if (textBottomSheetRef.current) {
      console.log('🔴 Calling present...');
      textBottomSheetRef.current.present();
      console.log('🔴 Present called!');
    } else {
      console.log('🔴 REF IS NULL!');
    }
  };

  const openLogoSheet = () => {
    console.log('🟡 BUTTON PRESSED: Opening logo sheet...');
    console.log('🟡 Logo ref exists:', !!logoBottomSheetRef.current);
    if (logoBottomSheetRef.current) {
      console.log('🟡 Calling present...');
      logoBottomSheetRef.current.present();
      console.log('🟡 Present called!');
    } else {
      console.log('🟡 REF IS NULL!');
    }
  };

  const testButton = () => {
    console.log('Test button pressed!');
    Alert.alert('Test', 'Button is working!');
  };

  const [showTestModal, setShowTestModal] = useState(false);

  const testModal = () => {
    console.log('Testing modal...');
    setShowTestModal(true);
  };

  const testBottomSheet = () => {
    console.log('🟢 TESTING SHEET...');
    console.log('🟢 Text ref:', textBottomSheetRef.current);
    
    if (textBottomSheetRef.current) {
      try {
        console.log('🟢 Trying present...');
        textBottomSheetRef.current.present();
        console.log('🟢 Present successful!');
      } catch (error) {
        console.log('🟢 Expand failed, trying snapToIndex:', error);
        try {
          textBottomSheetRef.current.snapToIndex(0);
          console.log('🟢 snapToIndex successful!');
        } catch (error2) {
          console.log('🟢 snapToIndex also failed:', error2);
        }
      }
    } else {
      console.log('🟢 NO REF AVAILABLE!');
    }
  };

  // Backdrop component for bottom sheets
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

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
        x: screenWidth / 2 - 50,
        y: 200,
        width: 100,
        height: 100,
        data: { imageUri: result.assets[0].uri },
      };
      
      setCanvasElements(prev => [...prev, newElement]);
      logoBottomSheetRef.current?.dismiss();
      setSelectedElement(newElement.id);
    }
  };

  const deleteElement = (id: string) => {
    setCanvasElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null);
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
      setSelectedElement(newElement.id);
    }
  };

  const exportImage = async () => {
    if (!selectedImage) {
      Alert.alert('خطأ', 'يرجى اختيار صورة أولاً');
      return;
    }
    
    try {
      const designToSave = {
        id: params.designId as string || Date.now().toString(),
        title: params.designTitle as string || 'تصميم مخصص',
        description: params.designDescription as string || 'تصميم تم تخصيصه في المحرر',
        image_url: selectedImage,
        category: 'custom',
        tags: ['مخصص', 'محرر'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to API if we have a design ID from the API
      if (params.designId && params.designId !== 'custom') {
        try {
          await saveDesign({
            design_id: params.designId as string,
            notes: `تصميم مخصص: ${designToSave.title}`,
            image_type: 'edited'
          });
        } catch (apiError) {
          console.warn('Failed to save to API, saving locally only:', apiError);
        }
      }
      
      // Add to cart store
      addDesign(designToSave);
      
      Alert.alert(
        'تم الحفظ', 
        'تم حفظ التصميم في السلة بنجاح!',
        [
          { 
            text: 'العودة للسلة', 
            style: 'default',
            onPress: () => router.push('/cart')
          }
        ]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('خطأ', 'فشل في حفظ التصميم. حاول مرة أخرى');
    }
  };

  const DraggableElement = ({ element }: { element: CanvasElement }) => {
    const translateX = useSharedValue(element.x);
    const translateY = useSharedValue(element.y);
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);
    const isSelected = selectedElement === element.id;

    // Update position when element changes
    React.useEffect(() => {
      translateX.value = element.x;
      translateY.value = element.y;
    }, [element.x, element.y, translateX, translateY]);

    const updateElementPosition = (x: number, y: number) => {
      setCanvasElements(prev => prev.map(el => 
        el.id === element.id 
          ? { ...el, x: Math.max(0, Math.min(screenWidth - 40 - el.width, x)), y: Math.max(0, Math.min(screenHeight * 0.6 - el.height, y)) }
          : el
      ));
    };

    const selectElement = () => {
                  setSelectedElement(element.id);
    };

    const gestureHandler = useAnimatedGestureHandler({
      onStart: (_, context: any) => {
        context.startX = translateX.value;
        context.startY = translateY.value;
        runOnJS(selectElement)();
        
        scale.value = withSpring(1.05);
        opacity.value = withSpring(0.9);
      },
      onActive: (event, context: any) => {
        const newX = context.startX + event.translationX;
        const newY = context.startY + event.translationY;
        
        // Constrain to canvas bounds
        const constrainedX = Math.max(0, Math.min(screenWidth - 40 - element.width, newX));
        const constrainedY = Math.max(0, Math.min(screenHeight * 0.6 - element.height, newY));
        
        translateX.value = constrainedX;
        translateY.value = constrainedY;
      },
      onEnd: () => {
        scale.value = withSpring(1);
        opacity.value = withSpring(1);
        
        runOnJS(updateElementPosition)(translateX.value, translateY.value);
      },
    });

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
        opacity: opacity.value,
        zIndex: isSelected ? 1000 : 1,
      };
    });

    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
                style={[
                  styles.canvasElement,
                  {
                    width: element.width,
                    height: element.height,
              position: 'absolute',
              left: 0,
              top: 0,
            },
            animatedStyle,
          ]}
        >
          {/* Enhanced Selection Border */}
          {isSelected && (
            <View style={styles.selectionBorder}>
              <View style={[styles.selectionCorner, styles.topLeft]} />
              <View style={[styles.selectionCorner, styles.topRight]} />
              <View style={[styles.selectionCorner, styles.bottomLeft]} />
              <View style={[styles.selectionCorner, styles.bottomRight]} />
              <View style={styles.selectionHandle} />
            </View>
          )}
          
                {element.type === 'text' && (
                  <Text
                    style={[
                      styles.canvasText,
                      {
                        fontSize: element.data.fontSize,
                        color: element.data.color,
                  textShadowColor: 'rgba(0,0,0,0.8)',
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 4,
                      }
                    ]}
                  >
                    {element.data.text}
                  </Text>
                )}
                
                {element.type === 'logo' && (
                  <Image
                    source={{ uri: element.data.imageUri }}
                    style={styles.canvasLogo}
                    resizeMode="contain"
                  />
                )}
        </Animated.View>
            </PanGestureHandler>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>محرر التصاميم</Text>
          <Text style={styles.headerSubtitle}>اسحب العناصر بسلاسة</Text>
        </View>
        
        <TouchableOpacity onPress={exportImage} style={styles.saveButton}>
          <MaterialIcons name="bookmark" size={20} color="white" />
          <Text style={styles.saveButtonText}>حفظ</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas Area */}
      <View style={styles.canvasContainer}>
        {selectedImage ? (
          <View style={styles.canvas}>
              {/* Background Image */}
              <View style={styles.backgroundImageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.backgroundImage}
                  resizeMode="cover"
                />
                <View style={styles.canvasOverlay} />
              </View>
              
              {/* Canvas Elements with Perfect Dragging */}
              {canvasElements.map((element) => (
                <DraggableElement key={element.id} element={element} />
              ))}
              
              {/* Tap to deselect area */}
              <TouchableOpacity 
                style={styles.deselectArea}
                onPress={() => setSelectedElement(null)}
                activeOpacity={1}
              />
            </View>
        ) : (
          <View style={styles.emptyCanvas}>
            <View style={styles.emptyCanvasIcon}>
              <MaterialIcons name="palette" size={60} color={BRAND_COLORS.primary} />
            </View>
            <Text style={styles.emptyCanvasTitle}>ابدأ إبداع تصميمك</Text>
            <Text style={styles.emptyCanvasSubtitle}>
              تصميمك جاهز! أضف النصوص والشعارات
            </Text>
          </View>
        )}
      </View>

      {/* Simplified Premium Tools Panel */}
      <View style={styles.toolsPanel}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.toolsScroll}
          contentContainerStyle={styles.toolsContainer}
        >
          <AnimatedTouchableOpacity 
            style={styles.toolButton}
            onPress={openTextSheet}
          >
            <View style={[styles.toolButtonIcon, styles.textTool, !selectedImage && styles.toolButtonIconDisabled]}>
              <MaterialIcons name="text-fields" size={22} color="white" />
            </View>
            <Text style={[styles.toolButtonText, !selectedImage && styles.toolButtonTextDisabled]}>نص</Text>
          </AnimatedTouchableOpacity>
          
          <AnimatedTouchableOpacity 
            style={styles.toolButton}
            onPress={openLogoSheet}
          >
            <View style={[styles.toolButtonIcon, styles.logoTool, !selectedImage && styles.toolButtonIconDisabled]}>
              <FontAwesome6 name="image" size={22} color="white" />
            </View>
            <Text style={[styles.toolButtonText, !selectedImage && styles.toolButtonTextDisabled]}>شعار</Text>
          </AnimatedTouchableOpacity>
          
          <AnimatedTouchableOpacity 
            style={[styles.toolButton, !selectedElement && styles.toolButtonDisabled]}
            onPress={() => selectedElement && duplicateElement(selectedElement)}
            disabled={!selectedElement}
          >
            <View style={[styles.toolButtonIcon, styles.copyTool, !selectedElement && styles.toolButtonIconDisabled]}>
              <MaterialIcons name="content-copy" size={22} color="white" />
            </View>
            <Text style={[styles.toolButtonText, !selectedElement && styles.toolButtonTextDisabled]}>نسخ</Text>
          </AnimatedTouchableOpacity>
          
          <AnimatedTouchableOpacity 
            style={[styles.toolButton, !selectedElement && styles.toolButtonDisabled]}
            onPress={() => selectedElement && deleteElement(selectedElement)}
            disabled={!selectedElement}
          >
            <View style={[styles.toolButtonIcon, styles.deleteTool, !selectedElement && styles.toolButtonIconDisabled]}>
              <MaterialIcons name="delete" size={22} color="white" />
            </View>
            <Text style={[styles.toolButtonText, !selectedElement && styles.toolButtonTextDisabled]}>حذف</Text>
          </AnimatedTouchableOpacity>
          
          <AnimatedTouchableOpacity 
            style={styles.toolButton}
            onPress={testButton}
          >
            <View style={[styles.toolButtonIcon, { backgroundColor: '#10B981' }]}>
              <MaterialIcons name="bug-report" size={22} color="white" />
            </View>
            <Text style={styles.toolButtonText}>اختبار</Text>
          </AnimatedTouchableOpacity>
          
          <AnimatedTouchableOpacity 
            style={styles.toolButton}
            onPress={testBottomSheet}
          >
            <View style={[styles.toolButtonIcon, { backgroundColor: '#8B5CF6' }]}>
              <MaterialIcons name="open-in-full" size={22} color="white" />
            </View>
            <Text style={styles.toolButtonText}>ورقة</Text>
          </AnimatedTouchableOpacity>
          
          <AnimatedTouchableOpacity 
            style={styles.toolButton}
            onPress={testModal}
          >
            <View style={[styles.toolButtonIcon, { backgroundColor: '#F59E0B' }]}>
              <MaterialIcons name="view-module" size={22} color="white" />
            </View>
            <Text style={styles.toolButtonText}>مودال</Text>
          </AnimatedTouchableOpacity>
        </ScrollView>
                </View>

      {/* Text Input Bottom Sheet */}
      <BottomSheetModal
        ref={textBottomSheetRef}
        snapPoints={textSnapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        onChange={(index) => {
          console.log('🔵 TEXT SHEET INDEX CHANGED:', index);
        }}
        onAnimate={(fromIndex, toIndex) => {
          console.log('🔵 TEXT SHEET ANIMATING FROM', fromIndex, 'TO', toIndex);
        }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <MaterialIcons name="text-fields" size={28} color={BRAND_COLORS.primary} />
            <Text style={styles.bottomSheetTitle}>إضافة نص رائع</Text>
            <Text style={styles.bottomSheetSubtitle}>اكتب النص وخصصه بالطريقة التي تريدها</Text>
          </View>
            
            <TextInput
            style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="اكتب النص هنا..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            
          {/* Enhanced Font Size Control */}
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>حجم الخط:</Text>
            <View style={styles.sizeControls}>
                <TouchableOpacity 
                style={styles.sizeButton}
                onPress={() => setFontSize(Math.max(18, fontSize - 4))}
                >
                <Text style={styles.sizeButtonText}>-</Text>
                </TouchableOpacity>
              <Text style={styles.sizeValue}>{fontSize}</Text>
                <TouchableOpacity 
                style={styles.sizeButton}
                onPress={() => setFontSize(Math.min(52, fontSize + 4))}
                >
                <Text style={styles.sizeButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
          {/* Enhanced Color Picker */}
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>لون النص:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.colorPicker}>
                {['#FFFFFF', '#000000', '#FF4444', '#44FF44', '#4444FF', '#FFFF44', '#FF44FF', '#44FFFF', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      textColor === color && styles.selectedColor
                    ]}
                    onPress={() => setTextColor(color)}
                  />
                ))}
              </View>
            </ScrollView>
            </View>
            
          <View style={styles.bottomSheetButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => textBottomSheetRef.current?.dismiss()}
            >
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={addTextElement}
            >
              <MaterialIcons name="add" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.confirmButtonText}>إضافة النص</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Logo Upload Bottom Sheet */}
      <BottomSheetModal
        ref={logoBottomSheetRef}
        snapPoints={logoSnapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <FontAwesome6 name="image" size={28} color={BRAND_COLORS.primary} />
            <Text style={styles.bottomSheetTitle}>إضافة شعار مميز</Text>
            <Text style={styles.bottomSheetSubtitle}>اختر شعار أو صورة من معرض الصور</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.logoUploadArea}
            onPress={addLogoElement}
          >
            <View style={styles.uploadIconContainer}>
              <MaterialIcons name="add-photo-alternate" size={48} color={BRAND_COLORS.primary} />
            </View>
            <Text style={styles.logoUploadText}>اختيار شعار من المعرض</Text>
            <Text style={styles.logoUploadSubtext}>JPG, PNG أو GIF</Text>
          </TouchableOpacity>

          <View style={styles.logoTips}>
            <Text style={styles.tipText}>💡 يُفضل استخدام صور عالية الجودة مع خلفية شفافة</Text>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Test Modal */}
      <Modal
        visible={showTestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Test Modal</Text>
            <Text style={styles.modalText}>This is a test modal to see if modals work!</Text>
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setShowTestModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerButton: {
    padding: SPACING.sm,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  canvasContainer: {
    flex: 1,
    margin: SPACING.lg,
  },
  emptyCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 40,
    paddingVertical: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  emptyCanvasIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyCanvasTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  emptyCanvasSubtitle: {
    fontSize: 17,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  backgroundImageContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  canvasOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  deselectArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  canvasElement: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  selectionBorder: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderWidth: 3,
    borderColor: BRAND_COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  selectionCorner: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: BRAND_COLORS.primary,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  topLeft: {
    top: -8,
    left: -8,
  },
  topRight: {
    top: -8,
    right: -8,
  },
  bottomLeft: {
    bottom: -8,
    left: -8,
  },
  bottomRight: {
    bottom: -8,
    right: -8,
  },
  selectionHandle: {
    position: 'absolute',
    top: -12,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: BRAND_COLORS.primary,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  canvasText: {
    textAlign: 'center',
    fontWeight: '700',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    lineHeight: undefined,
  },
  canvasLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  toolsPanel: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  toolsScroll: {
    paddingHorizontal: SPACING.lg,
  },
  toolsContainer: {
    gap: 24,
    paddingHorizontal: 8,
  },
  toolButton: {
    alignItems: 'center',
    minWidth: 85,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  toolButtonDisabled: {
    opacity: 0.4,
  },
  toolButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  toolButtonIconDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
  },
  textTool: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  logoTool: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  copyTool: { 
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  deleteTool: { 
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  toolButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  toolButtonTextDisabled: {
    color: '#9CA3AF',
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
    minHeight: 120,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: '#fafafa',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  controlLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  sizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sizeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_COLORS.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sizeButtonText: {
    color: '#ffde9f',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  sizeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    minWidth: 45,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedColor: {
    borderColor: BRAND_COLORS.text.primary,
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  logoUploadArea: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoUploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND_COLORS.text.primary,
    marginTop: 12,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  logoUploadSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: BRAND_COLORS.text.secondary,
    marginTop: 4,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  // Test Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_COLORS.primary,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 25,
  },
  modalButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 15,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  bottomSheetIndicator: {
    backgroundColor: '#e2e8f0',
    width: 40,
    height: 4,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bottomSheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: BRAND_COLORS.text.primary,
    marginTop: 10,
    textAlign: 'center',
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: BRAND_COLORS.text.secondary,
    marginTop: 5,
    textAlign: 'center',
  },
  bottomSheetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginTop: 30,
    marginBottom: 20,
  },
  logoTips: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});