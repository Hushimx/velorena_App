import { forwardRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';

interface SmartTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  errorStyle?: any;
}

const SmartTextInput = forwardRef<TextInput, SmartTextInputProps>(
  (
    {
      label,
      error,
      containerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      onFocus,
      style,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (event: any) => {
      setIsFocused(true);
      onFocus?.(event);
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        )}
        <TextInput
          ref={ref}
          style={[
            styles.input, 
            isFocused && styles.inputFocused,
            error && styles.inputError,
            inputStyle, 
            style
          ]}
          placeholderTextColor={BRAND_COLORS.text.tertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="next"
          blurOnSubmit={false}
          textAlign="right"
          {...props}
        />
        {error && (
          <Text style={[styles.error, errorStyle]}>{error}</Text>
        )}
      </View>
    );
  }
);

SmartTextInput.displayName = 'SmartTextInput';

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
  input: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  inputFocused: {
    borderColor: BRAND_COLORS.secondary,
  },
  inputError: {
    borderColor: BRAND_COLORS.error,
  },
  error: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.error,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
});

export default SmartTextInput;

