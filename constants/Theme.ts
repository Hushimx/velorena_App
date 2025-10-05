// Removed react-native-ui-lib dependency

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
    error: '#ef4444',
    success: '#10b981',
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

// Simple theme initialization (no UI Lib dependency)
export const initializeTheme = () => {
  // Theme is now just constants - no initialization needed
  console.log('Theme initialized with constants');
};

// Export theme constants for direct use
export {
  BORDER_RADIUS as BorderRadius, BRAND_COLORS as Colors, SHADOWS as Shadows, SPACING as Spacing, TYPOGRAPHY as Typography
};

