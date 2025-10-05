import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useEffect } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { Design, getImageUrl } from '../../utils/api';

// Removed unused screen dimensions

interface DesignBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  design: Design | null;
  onAddToCart: (design: Design) => void;
  onRemoveFromCart: (design: Design) => void;
  onEdit: (design: Design) => void;
  loading?: boolean;
}

export default function DesignBottomSheet({
  bottomSheetRef,
  design,
  onAddToCart,
  onRemoveFromCart,
  onEdit,
  loading = false,
}: DesignBottomSheetProps) {
  const snapPoints = useMemo(() => ['85%', '95%'], []);

  // Fix for iOS bottom sheet display issue
  useEffect(() => {
    if (Platform.OS === 'ios' && bottomSheetRef.current && design) {
      // Force a small delay to ensure proper rendering on iOS
      const timer = setTimeout(() => {
        bottomSheetRef.current?.present();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [bottomSheetRef, design]);

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

  if (!design) return null;

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
          <Text style={styles.headerTitle}>تفاصيل التصميم</Text>
          <TouchableOpacity
            onPress={() => bottomSheetRef.current?.dismiss()}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={24} color={BRAND_COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <View style={styles.scrollableContent}>
          {/* Design Image */}
          <View style={styles.imageContainer}>
            <Image
              source={(() => {
                const imageUrl = getImageUrl(design.image_url);
                return imageUrl ? { uri: imageUrl } : require('../../assets/images/catagory-placeholer.png');
              })()}
              style={styles.designImage}
              resizeMode="cover"
            />
          </View>

          {/* Design Info */}
          <View style={styles.infoContainer}>
            {design.tags && design.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {design.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                onEdit(design);
                bottomSheetRef.current?.dismiss();
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="edit" size={20} color="white" />
              <Text style={styles.buttonText}>تعديل التصميم</Text>
            </TouchableOpacity>

            {design.in_cart ? (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  onRemoveFromCart(design);
                  bottomSheetRef.current?.dismiss();
                }}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialIcons name="remove-shopping-cart" size={20} color="white" />
                )}
                <Text style={styles.buttonText}>إزالة من السلة</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  onAddToCart(design);
                  bottomSheetRef.current?.dismiss();
                }}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <MaterialIcons name="add-shopping-cart" size={20} color="white" />
                )}
                <Text style={styles.buttonText}>إضافة للسلة</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: '#D1D5DB',
    width: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  scrollableContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    marginVertical: SPACING.lg,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  designImage: {
    width: '100%',
    height: 200,
  },
  infoContainer: {
    marginBottom: SPACING.lg,
  },
  designTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  designDescription: {
    fontSize: 16,
    color: BRAND_COLORS.text.secondary,
    lineHeight: 24,
    textAlign: 'right',
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tag: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: BRAND_COLORS.primary,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  actionsContainer: {
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  editButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
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
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
});
