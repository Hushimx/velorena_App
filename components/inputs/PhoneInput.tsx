import { MaterialIcons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import SmartTextInput from './SmartTextInput';

// Function to convert country code to flag emoji
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

interface PhoneInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  scrollViewRef?: React.RefObject<any>;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  error?: string;
  onFocusWithScroll?: () => void;
  selectedCountry?: Country | null;
  onCountrySelect?: (country: Country) => void;
}

const PhoneInput = forwardRef<TextInput, PhoneInputProps>(
  (
    {
      label = 'رقم الجوال',
      placeholder = 'ادخل رقم الجوال',
      value,
      onChangeText,
      scrollViewRef,
      containerStyle,
      inputStyle,
      labelStyle,
      error,
      onFocusWithScroll,
      selectedCountry,
      onCountrySelect,
      ...props
    },
    ref
  ) => {
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [internalCountry, setInternalCountry] = useState<Country | null>(null);

    // Use external country state if provided, otherwise use internal
    const currentCountry = selectedCountry !== undefined ? selectedCountry : internalCountry;

    const handleCountrySelect = (country: Country) => {
      if (onCountrySelect) {
        onCountrySelect(country);
      } else {
        setInternalCountry(country);
      }
      setShowCountryPicker(false);
    };

    return (
      <View style={containerStyle}>
        {label && (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        )}
        <View style={styles.phoneInputWrapper}>
          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => setShowCountryPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.countryFlag}>
              {currentCountry ? getFlagEmoji(currentCountry.cca2) : '🇸🇦'}
            </Text>
            <Text style={styles.countryCode}>
              +{currentCountry?.callingCode?.[0] || '966'}
            </Text>
            <MaterialIcons 
              name="keyboard-arrow-down" 
              size={16} 
              color={BRAND_COLORS.text.secondary} 
            />
          </TouchableOpacity>
          <SmartTextInput
            ref={ref}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            keyboardType="phone-pad"
            scrollViewRef={scrollViewRef}
            inputStyle={[styles.phoneInput, inputStyle]}
            error={error}
            onFocusWithScroll={onFocusWithScroll}
            {...props}
          />
        </View>
        
        <CountryPicker
          withFilter
          withFlag
          withCallingCode
          withEmoji
          withFlagButton
          countryCode={currentCountry?.cca2 || 'SA'}
          visible={showCountryPicker}
          onSelect={handleCountrySelect}
          onClose={() => setShowCountryPicker(false)}
          translation="common"
          theme={{
            flagSizeButton: 20,
            flagSize: 20,
          }}
        />
      </View>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

const styles = StyleSheet.create({
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING['2xl'],
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0, // Remove default margin since we handle it at wrapper level
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: BRAND_COLORS.background.primary,
    gap: SPACING.xs,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
  },
});

export default PhoneInput;

