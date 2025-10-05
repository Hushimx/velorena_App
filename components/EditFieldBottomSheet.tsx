import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';

interface EditFieldBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetModal | null>;
  title: string;
  field: string;
  value: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  onSave: (field: string, value: string) => Promise<void>;
}

const EditFieldBottomSheet = forwardRef<BottomSheetModal, EditFieldBottomSheetProps>(({
  bottomSheetRef,
  title,
  field,
  value,
  placeholder,
  keyboardType = 'default',
  onSave,
}, ref) => {
  const snapPoints = useMemo(() => ['50%'], []);
  const [editValue, setEditValue] = useState(value);
  const [loading, setLoading] = useState(false);

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

  const handleSave = async () => {
    if (editValue.trim() === '') {
      Alert.alert('خطأ', 'يرجى إدخال قيمة صحيحة');
      return;
    }

    setLoading(true);
    try {
      await onSave(field, editValue.trim());
      bottomSheetRef.current?.dismiss();
      Alert.alert('نجح', 'تم تحديث البيانات بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحديث البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    bottomSheetRef.current?.dismiss();
  };

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (bottomSheetRef.current) {
        handleCancel();
        return true; // Prevent default behavior
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      enablePanDownToClose={true}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.closeButton}
          >
            <MaterialIcons name="close" size={24} color={BRAND_COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <TextInput
            style={styles.input}
            value={editValue}
            onChangeText={setEditValue}
            placeholder={placeholder}
            keyboardType={keyboardType}
            placeholderTextColor={BRAND_COLORS.text.tertiary}
          />
        </View>

        {/* Actions */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'جاري الحفظ...' : 'حفظ'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

EditFieldBottomSheet.displayName = 'EditFieldBottomSheet';

export default EditFieldBottomSheet;

const styles = StyleSheet.create({
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
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.gray[200],
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
  content: {
    paddingVertical: SPACING.lg,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    backgroundColor: BRAND_COLORS.background.primary,
    textAlign: 'right',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.gray[100],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.secondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.white,
  },
});
