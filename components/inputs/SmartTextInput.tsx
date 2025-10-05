import React, { forwardRef, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    Keyboard,
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
  scrollViewRef?: React.RefObject<any>;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  errorStyle?: any;
  onFocusWithScroll?: () => void;
}

const SmartTextInput = forwardRef<TextInput, SmartTextInputProps>(
  (
    {
      label,
      error,
      scrollViewRef,
      containerStyle,
      inputStyle,
      labelStyle,
      errorStyle,
      onFocusWithScroll,
      onFocus,
      style,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);
    const containerRef = useRef<View>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isFocused, setIsFocused] = useState(false);

    // Expose the ref
    React.useImperativeHandle(ref, () => inputRef.current!);

    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
        }
      );

      return () => {
        keyboardDidShowListener?.remove();
        keyboardDidHideListener?.remove();
      };
    }, []);

    const handleFocus = (event: any) => {
      setIsFocused(true);
      // Call the original onFocus if provided
      onFocus?.(event);

      // Handle smart scrolling
      if (scrollViewRef?.current && containerRef.current) {
        setTimeout(() => {
          containerRef.current?.measureInWindow(
            (x: number, y: number, width: number, height: number) => {
              const screenHeight = Dimensions.get('window').height;
              const keyboardTop = screenHeight - keyboardHeight;
              const inputBottom = y + height;
              const extraOffset = 50; // Additional padding above keyboard

              if (inputBottom > keyboardTop - extraOffset) {
                const scrollToY = inputBottom - keyboardTop + extraOffset + 20;
                scrollViewRef.current?.scrollTo({
                  y: scrollToY,
                  animated: true,
                });
              }
            }
          );
        }, 100);
      }

      // Call custom focus handler if provided
      onFocusWithScroll?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
    };

    return (
      <View ref={containerRef} style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        )}
        <TextInput
          ref={inputRef}
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
    marginBottom: SPACING['2xl'],
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    backgroundColor: BRAND_COLORS.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderColor: BRAND_COLORS.border.focus,
    shadowColor: BRAND_COLORS.border.focus,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: BRAND_COLORS.border.error,
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

