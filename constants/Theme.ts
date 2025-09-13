import { Colors, Spacings, ThemeManager, Typography } from 'react-native-ui-lib';

// Brand Colors
export const BRAND_COLORS = {
  // Primary brand colors
  primary: '#2a1e1e', // Brown Dark
  secondary: '#ffde9f', // Yellow
  accent: '#f5d182', // Yellow Dark
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#ffde9f',
    tertiary: '#f9fafb',
  },
  
  // Text colors
  text: {
    primary: '#2a1e1e',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
  },
  
  // Border colors
  border: {
    primary: '#e5e7eb',
    secondary: '#ffde9f',
    focus: '#2a1e1e',
  },
} as const;

// Typography
export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    regular: 'NotoSansArabic_400Regular',
    medium: 'NotoSansArabic_500Medium',
    semiBold: 'NotoSansArabic_600SemiBold',
    bold: 'NotoSansArabic_700Bold',
    extraBold: 'NotoSansArabic_800ExtraBold',
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

// Border radius
export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Initialize UI Lib Theme
export const initializeTheme = () => {
  // Load colors
  Colors.loadColors({
    // Brand colors
    primaryColor: BRAND_COLORS.primary,
    secondaryColor: BRAND_COLORS.secondary,
    accentColor: BRAND_COLORS.accent,
    
    // Status colors
    successColor: BRAND_COLORS.success,
    warningColor: BRAND_COLORS.warning,
    errorColor: BRAND_COLORS.error,
    infoColor: BRAND_COLORS.info,
    
    // Background colors
    backgroundColor: BRAND_COLORS.background.primary,
    backgroundSecondary: BRAND_COLORS.background.secondary,
    backgroundTertiary: BRAND_COLORS.background.tertiary,
    
    // Text colors
    textColor: BRAND_COLORS.text.primary,
    textSecondary: BRAND_COLORS.text.secondary,
    textTertiary: BRAND_COLORS.text.tertiary,
    textInverse: BRAND_COLORS.text.inverse,
    
    // Border colors
    borderColor: BRAND_COLORS.border.primary,
    borderSecondary: BRAND_COLORS.border.secondary,
    borderFocus: BRAND_COLORS.border.focus,
    
    // Gray scale
    gray50: BRAND_COLORS.gray[50],
    gray100: BRAND_COLORS.gray[100],
    gray200: BRAND_COLORS.gray[200],
    gray300: BRAND_COLORS.gray[300],
    gray400: BRAND_COLORS.gray[400],
    gray500: BRAND_COLORS.gray[500],
    gray600: BRAND_COLORS.gray[600],
    gray700: BRAND_COLORS.gray[700],
    gray800: BRAND_COLORS.gray[800],
    gray900: BRAND_COLORS.gray[900],
  });

  // Load typography
  Typography.loadTypographies({
    // Headings
    h1: {
      fontSize: TYPOGRAPHY.fontSize['4xl'],
      fontWeight: '800',
      fontFamily: TYPOGRAPHY.fontFamily.extraBold,
      lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize['4xl'],
    },
    h2: {
      fontSize: TYPOGRAPHY.fontSize['3xl'],
      fontWeight: '700',
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize['3xl'],
    },
    h3: {
      fontSize: TYPOGRAPHY.fontSize['2xl'],
      fontWeight: '700',
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize['2xl'],
    },
    h4: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      fontWeight: '600',
      fontFamily: TYPOGRAPHY.fontFamily.semiBold,
      lineHeight: TYPOGRAPHY.lineHeight.tight * TYPOGRAPHY.fontSize.xl,
    },
    
    // Body text
    body: {
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: '400',
      fontFamily: TYPOGRAPHY.fontFamily.regular,
      lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    },
    bodyMedium: {
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: '500',
      fontFamily: TYPOGRAPHY.fontFamily.medium,
      lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    },
    bodySemiBold: {
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: '600',
      fontFamily: TYPOGRAPHY.fontFamily.semiBold,
      lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.base,
    },
    
    // Small text
    small: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: '400',
      fontFamily: TYPOGRAPHY.fontFamily.regular,
      lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
    },
    smallMedium: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: '500',
      fontFamily: TYPOGRAPHY.fontFamily.medium,
      lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
    },
    smallSemiBold: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: '600',
      fontFamily: TYPOGRAPHY.fontFamily.semiBold,
      lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.sm,
    },
    
    // Extra small text
    xs: {
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: '400',
      fontFamily: TYPOGRAPHY.fontFamily.regular,
      lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.xs,
    },
    xsMedium: {
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: '500',
      fontFamily: TYPOGRAPHY.fontFamily.medium,
      lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.xs,
    },
    xsSemiBold: {
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: '600',
      fontFamily: TYPOGRAPHY.fontFamily.semiBold,
      lineHeight: TYPOGRAPHY.lineHeight.normal * TYPOGRAPHY.fontSize.xs,
    },
  });

  // Load spacings
  Spacings.loadSpacings({
    xs: SPACING.xs,
    sm: SPACING.sm,
    md: SPACING.md,
    lg: SPACING.lg,
    xl: SPACING.xl,
    '2xl': SPACING['2xl'],
    '3xl': SPACING['3xl'],
    '4xl': SPACING['4xl'],
    '5xl': SPACING['5xl'],
    '6xl': SPACING['6xl'],
  });

  // Configure component themes
  ThemeManager.setComponentTheme('Button', (props, context) => {
    const baseTheme = {
      borderRadius: BORDER_RADIUS.lg,
      height: 48,
    };

    if (props.primary) {
      return {
        ...baseTheme,
        backgroundColor: BRAND_COLORS.primary,
        color: BRAND_COLORS.text.inverse,
      };
    }

    if (props.secondary) {
      return {
        ...baseTheme,
        backgroundColor: BRAND_COLORS.secondary,
        color: BRAND_COLORS.text.primary,
        borderWidth: 1,
        borderColor: BRAND_COLORS.border.secondary,
      };
    }

    if (props.outline) {
      return {
        ...baseTheme,
        backgroundColor: 'transparent',
        color: BRAND_COLORS.text.primary,
        borderWidth: 2,
        borderColor: BRAND_COLORS.primary,
      };
    }

    return baseTheme;
  });

  ThemeManager.setComponentTheme('Card', {
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: BRAND_COLORS.background.primary,
    ...SHADOWS.md,
  });

  ThemeManager.setComponentTheme('Input', {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    backgroundColor: BRAND_COLORS.background.primary,
    color: BRAND_COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  });

  ThemeManager.setComponentTheme('Text', {
    color: BRAND_COLORS.text.primary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  });
};

// Export theme constants for direct use
export {
  BORDER_RADIUS as BorderRadius, BRAND_COLORS as Colors, SHADOWS as Shadows, SPACING as Spacing, TYPOGRAPHY as Typography
};

