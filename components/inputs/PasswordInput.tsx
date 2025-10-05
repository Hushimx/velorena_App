import { MaterialIcons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { BRAND_COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/Theme';

interface PasswordInputProps {
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
  returnKeyType?: 'done' | 'next';
}

const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      scrollViewRef,
      containerStyle,
      inputStyle,
      labelStyle,
      error,
      onFocusWithScroll,
      returnKeyType = 'next',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (event: any) => {
      setIsFocused(true);
      onFocusWithScroll?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        )}
        <View style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError
        ]}>
          <TextInput
            ref={ref}
            style={[styles.input, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor={BRAND_COLORS.text.tertiary}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!showPassword}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType={returnKeyType}
            textContentType="password"
            autoCapitalize="none"
            textAlign="right"
            {...props}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color={BRAND_COLORS.text.secondary}
            />
          </TouchableOpacity>
        </View>
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
      </View>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: BRAND_COLORS.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: BRAND_COLORS.border.focus,
    shadowColor: BRAND_COLORS.border.focus,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainerError: {
    borderColor: BRAND_COLORS.border.error,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingRight: SPACING['4xl'], // Space for eye icon
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
  },
  eyeIcon: {
    position: 'absolute',
    right: SPACING.lg,
    padding: SPACING.xs,
    zIndex: 1,
  },
  error: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.error,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
});

export default PasswordInput;

