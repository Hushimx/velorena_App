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

    return (
      <View ref={containerRef} style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, labelStyle]}>{label}</Text>
        )}
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle, style]}
          placeholderTextColor={BRAND_COLORS.text.tertiary}
          onFocus={handleFocus}
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
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    backgroundColor: BRAND_COLORS.background.primary,
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

