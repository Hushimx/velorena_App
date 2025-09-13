import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';

export default function SignupScreen() {
  const [selectedType, setSelectedType] = useState<'individual' | 'company' | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleTypeSelection = (type: 'individual' | 'company') => {
    setSelectedType(type);
    if (type === 'company') {
      router.push('/signup/company');
    } else if (type === 'individual') {
      router.push('/signup/individual');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar backgroundColor={BRAND_COLORS.background.primary} barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>تسجيل حساب في فيلورينا</Text>
          <Text style={styles.subtitle}>اختر نوع الحساب الذي تريد إنشاؤه</Text>
        </View>

        {/* Type Selection */}
        <View style={styles.typeSelection}>
          {/* Individual Option */}
          <TouchableOpacity 
            style={[
              styles.typeOption,
              selectedType === 'individual' && styles.typeOptionSelected
            ]} 
            onPress={() => handleTypeSelection('individual')}
            activeOpacity={0.8}
          >
            <View style={styles.typeIconContainer}>
              <MaterialIcons 
                name="person" 
                size={32} 
                color={selectedType === 'individual' ? BRAND_COLORS.text.inverse : BRAND_COLORS.text.primary} 
              />
            </View>
            <Text style={[
              styles.typeTitle,
              selectedType === 'individual' && styles.typeTitleSelected
            ]}>
              تسجيل كفرد
            </Text>
            <Text style={[
              styles.typeDescription,
              selectedType === 'individual' && styles.typeDescriptionSelected
            ]}>
              للأفراد والمستقلين
            </Text>
          </TouchableOpacity>

          {/* Company Option */}
          <TouchableOpacity 
            style={[
              styles.typeOption,
              selectedType === 'company' && styles.typeOptionSelected
            ]} 
            onPress={() => handleTypeSelection('company')}
            activeOpacity={0.8}
          >
            <View style={styles.typeIconContainer}>
              <MaterialIcons 
                name="business" 
                size={32} 
                color={selectedType === 'company' ? BRAND_COLORS.text.inverse : BRAND_COLORS.text.primary} 
              />
            </View>
            <Text style={[
              styles.typeTitle,
              selectedType === 'company' && styles.typeTitleSelected
            ]}>
              تسجيل كشركة
            </Text>
            <Text style={[
              styles.typeDescription,
              selectedType === 'company' && styles.typeDescriptionSelected
            ]}>
              للشركات والمؤسسات
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>لديك حساب بالفعل؟</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING['2xl'],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING['6xl'],
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
  },
  typeSelection: {
    gap: SPACING.lg,
    marginBottom: SPACING['4xl'],
  },
  typeOption: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING['2xl'],
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.background.primary,
  },
  typeOptionSelected: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  typeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND_COLORS.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  typeTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  typeTitleSelected: {
    color: BRAND_COLORS.text.inverse,
  },
  typeDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
  },
  typeDescriptionSelected: {
    color: BRAND_COLORS.text.inverse,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: SPACING['2xl'],
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  loginLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textDecorationLine: 'underline',
  },
});
