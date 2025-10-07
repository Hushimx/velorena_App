import { MaterialIcons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';

interface PasswordInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  error?: string;
  returnKeyType?: 'done' | 'next';
}

const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      containerStyle,
      inputStyle,
      labelStyle,
      error,
      returnKeyType = 'next',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
      setIsFocused(true);
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
              size={20}
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
    marginBottom: SPACING.lg,
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
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  inputContainerFocused: {
    borderColor: BRAND_COLORS.secondary,
  },
  inputContainerError: {
    borderColor: BRAND_COLORS.error,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingRight: SPACING['3xl'],
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
  },
  eyeIcon: {
    position: 'absolute',
    right: SPACING.md,
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

