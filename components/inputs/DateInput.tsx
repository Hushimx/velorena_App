import { MaterialIcons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';

interface DateInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onDateSelect?: (date: Date) => void;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  error?: string;
  format?: 'arabic' | 'iso';
}

const DateInput = forwardRef<TouchableOpacity, DateInputProps>(
  (
    {
      label = 'تاريخ الميلاد',
      placeholder = 'تاريخ الميلاد',
      value,
      onDateSelect,
      containerStyle,
      inputStyle,
      labelStyle,
      error,
      format = 'arabic',
      ...props
    },
    ref
  ) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      onDateSelect?.(date);
      setShowDatePicker(false);
    };

    const formatDate = (date: Date) => {
      if (format === 'arabic') {
        return date.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      return date.toISOString().split('T')[0];
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        )}
        <TouchableOpacity
          ref={ref}
          style={[styles.dateInputContainer, inputStyle]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
          {...props}
        >
          <Text
            style={[
              styles.dateInputText,
              !value && styles.dateInputPlaceholder,
            ]}
          >
            {value || placeholder}
          </Text>
          <MaterialIcons 
            name="calendar-today" 
            size={20} 
            color={BRAND_COLORS.text.secondary} 
          />
        </TouchableOpacity>
        
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        {/* Simple Date Picker Modal */}
        {showDatePicker && (
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerModal}>
              <Text style={styles.datePickerTitle}>اختر تاريخ الميلاد</Text>
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerButtonText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePickerButton, styles.datePickerConfirm]}
                  onPress={() => handleDateSelect(new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000))}
                >
                  <Text style={styles.datePickerConfirmText}>تأكيد</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }
);

DateInput.displayName = 'DateInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING['2xl'],
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  dateInputText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  dateInputPlaceholder: {
    color: BRAND_COLORS.text.tertiary,
  },
  error: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.error,
    marginTop: SPACING.xs,
    textAlign: 'right',
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
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    width: '80%',
    maxWidth: 300,
  },
  datePickerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.lg,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    backgroundColor: BRAND_COLORS.background.primary,
    alignItems: 'center',
  },
  datePickerConfirm: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  datePickerButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  datePickerConfirmText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.inverse,
  },
});

export default DateInput;

