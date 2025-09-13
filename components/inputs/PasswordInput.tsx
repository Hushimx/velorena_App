import { MaterialIcons } from '@expo/vector-icons';
import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { BRAND_COLORS, SPACING } from '../../constants/Theme';
import SmartTextInput from './SmartTextInput';

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

    return (
      <View style={containerStyle}>
        <SmartTextInput
          ref={ref}
          label={label}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          scrollViewRef={scrollViewRef}
          inputStyle={[styles.passwordInput, inputStyle]}
          labelStyle={labelStyle}
          error={error}
          onFocusWithScroll={onFocusWithScroll}
          returnKeyType={returnKeyType}
          textContentType="password"
          autoCapitalize="none"
          {...props}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={20}
            color={BRAND_COLORS.text.secondary}
          />
        </TouchableOpacity>
      </View>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  passwordInput: {
    paddingRight: 50, // Make space for the eye icon
  },
  eyeIcon: {
    position: 'absolute',
    left: SPACING.lg,
    top: 36, // Adjust based on label height
    padding: SPACING.xs,
    zIndex: 1,
  },
});

export default PasswordInput;

