import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Design } from '../utils/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

interface DesignCardProps {
  design: Design;
  onSelect: (design: Design) => void;
  onEdit: (design: Design) => void;
}

const DesignCard = ({ design, onSelect, onEdit }: DesignCardProps) => {
  return (
    <View className="mb-4" style={{ width: CARD_WIDTH }}>
      <View className="bg-white rounded-lg overflow-hidden shadow-sm relative">
        <Image
          source={{ uri: design.image_url }}
          className="w-full h-48"
          resizeMode="cover"
        />
        
        {/* Always visible action buttons overlay */}
        <View 
          style={{ 
            position: 'absolute',
            bottom: 8,
            left: 8,
            right: 8,
            flexDirection: 'row',
            gap: 8
          }}
        >
          <TouchableOpacity 
            onPress={() => onSelect(design)}
            activeOpacity={0.8}
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              flex: 1
            }}
          >
            <Text style={{ 
              color: 'white', 
              fontWeight: 'bold', 
              fontSize: 12,
              textAlign: 'center'
            }}>
              حفظ واختيار
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              console.log('تعديل button pressed');
              onEdit(design);
            }}
            activeOpacity={0.8}
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 6,
              flex: 1
            }}
          >
            <Text style={{ 
              color: 'white', 
              fontWeight: 'bold', 
              fontSize: 12,
              textAlign: 'center'
            }}>
              تعديل
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Mock data for testing
const mockDesigns: Design[] = [
  {
    id: '1',
    title: 'تصميم أكياس ورقية بنية',
    description: 'تصميم أنيق لأكياس ورقية بنية مع أنماط ملونة',
    image_url: 'https://picsum.photos/400/400?random=1',
    category: 'packaging',
    tags: ['أكياس', 'ورق', 'تصميم'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    title: 'تصميم أكياس Bagh Bakari',
    description: 'تصميم كلاسيكي لأكياس Bagh Bakari مع زخارف بيضاء',
    image_url: 'https://picsum.photos/400/400?random=2',
    category: 'packaging',
    tags: ['أكياس', 'كلاسيكي', 'زخارف'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '3',
    title: 'تصميم أكياس ورقية ملونة',
    description: 'تصميم مبدع لأكياس ورقية مع ألوان زاهية',
    image_url: 'https://picsum.photos/400/400?random=3',
    category: 'packaging',
    tags: ['أكياس', 'ملون', 'مبدع'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '4',
    title: 'تصميم أكياس Bagh Bakari أحمر',
    description: 'تصميم جذاب لأكياس Bagh Bakari باللون الأحمر',
    image_url: 'https://picsum.photos/400/400?random=4',
    category: 'packaging',
    tags: ['أكياس', 'أحمر', 'جذاب'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '5',
    title: 'تصميم أكياس ورقية أنيقة',
    description: 'تصميم أنيق ومتطور لأكياس ورقية',
    image_url: 'https://picsum.photos/400/400?random=5',
    category: 'packaging',
    tags: ['أكياس', 'أنيق', 'متطور'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '6',
    title: 'تصميم أكياس Bagh Bakari أخضر',
    description: 'تصميم كلاسيكي لأكياس Bagh Bakari باللون الأخضر',
    image_url: 'https://picsum.photos/400/400?random=6',
    category: 'packaging',
    tags: ['أكياس', 'أخضر', 'كلاسيكي'],
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
];

export default function DesignsScreen() {
  const navigation = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال تفاصيل التصميم');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter mock designs based on search query
      const filteredDesigns = mockDesigns.filter(design => 
        design.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setDesigns(filteredDesigns.length > 0 ? filteredDesigns : mockDesigns);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء البحث');
      setDesigns([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleDesignSelect = (design: Design) => {
    // Navigate to design details or booking page
    navigation.push({
      pathname: '/booking',
      params: { designId: design.id, designTitle: design.title }
    });
  };

  const handleDesignEdit = (design: Design) => {
    console.log('Edit button pressed for design:', design);
    console.log('Design image URL:', design.image_url);
    try {
      // Navigate to photo editor with design
      const params = { 
        designId: design.id, 
        designImage: design.image_url,
        designTitle: design.title,
        designDescription: design.description || ''
      };
      console.log('Navigation params:', params);
      
      navigation.push({
        pathname: '/photo-editor',
        params: params
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء الانتقال إلى محرر الصور');
    }
  };

  const renderDesignItem = ({ item }: { item: Design }) => (
    <DesignCard 
      design={item} 
      onSelect={handleDesignSelect}
      onEdit={handleDesignEdit}
    />
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white pt-12 pb-4 px-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.back()}>
            <FontAwesome6 name="arrow-right" size={24} color="#2a1e1e" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-text-primary font-arabic-bold text-xl text-center">
              البحث في مكتبة التصاميم
            </Text>
            <Text className="text-text-secondary font-arabic-medium text-sm text-center mt-1">
              مولد تصميم مدعوم بالذكاء الاصطناعي يساعدك على إنشاء أفكار وتصاميم إبداعية
            </Text>
          </View>
          
          <View className="w-6" />
        </View>
      </View>

      {/* Search Section */}
      <View className="bg-white px-4 py-4">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-right font-arabic-medium text-base"
            placeholder="اكتب تفاصيل التصميم..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity 
            className="bg-button-primary ml-3 px-6 py-3 rounded-lg"
            onPress={handleSearch}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <FontAwesome6 name="magnifying-glass" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Section */}
      {hasSearched && (
        <View className="flex-1 px-4 pt-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-primary font-arabic-bold text-lg">
              النتائج
            </Text>
            {designs.length > 0 && (
              <Text className="text-text-secondary font-arabic-medium text-sm">
                {designs.length} تصميم
              </Text>
            )}
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#2a1e1e" />
              <Text className="text-text-secondary font-arabic-medium text-sm mt-4">
                جاري البحث في التصاميم...
              </Text>
            </View>
          ) : designs.length > 0 ? (
            <FlatList
              data={designs}
              renderItem={renderDesignItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <FontAwesome6 name="image" size={48} color="#D1D5DB" />
              <Text className="text-text-secondary font-arabic-medium text-base mt-4 text-center">
                لم يتم العثور على تصاميم
              </Text>
              <Text className="text-text-secondary font-arabic-medium text-sm mt-2 text-center">
                جرب البحث بكلمات مختلفة
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Initial State - Show when no search has been performed */}
      {!hasSearched && (
        <View className="flex-1 justify-center items-center px-8">
          <FontAwesome6 name="palette" size={64} color="#D1D5DB" />
          <Text className="text-text-primary font-arabic-bold text-xl mt-6 text-center">
            ابدأ البحث عن التصاميم
          </Text>
          <Text className="text-text-secondary font-arabic-medium text-base mt-3 text-center leading-6">
            اكتب وصفاً للتصميم الذي تريده وسنساعدك في العثور على أفضل الأفكار الإبداعية
          </Text>
        </View>
      )}
    </View>
  );
}