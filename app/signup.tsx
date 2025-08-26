import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignupScreen() {
  const [selectedType, setSelectedType] = useState<'individual' | 'company' | null>(null);
  const router = useRouter();

  const handleTypeSelection = (type: 'individual' | 'company') => {
    setSelectedType(type);
    if (type === 'company') {
      router.push('/signup/company-step1');
    } else if (type === 'individual') {
      router.push('/signup/individual');
    }
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign in pressed');
  };

  // When users finish signup via either path, their respective screens already navigate.

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.headerArea}>
          <Text style={styles.title}>تسجيل حساب</Text>
        </View>

        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Registration Type Selection */}
            <View style={styles.typeSelectionContainer}>
              {/* Individual Card */}
              <View style={styles.typeCard}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="person" size={100} color="#fff" />
                </View>
              </View>

              {/* Company Card */}
              <View style={styles.typeCard}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name="business" size={100} color="#fff" />
                </View>
              </View>
            </View>

            {/* Registration Type Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.typeButton} 
                onPress={() => handleTypeSelection('individual')}
                activeOpacity={0.8}
              >
                <Text style={styles.typeButtonText}>تسجيل كفرد</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.typeButton} 
                onPress={() => handleTypeSelection('company')}
                activeOpacity={0.8}
              >
                <Text style={styles.typeButtonText}>تسجيل كشركة</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerLabel}>أو</Text>
              <View style={styles.divider} />
            </View>

            {/* Google Sign-in Option */}
            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
            >
              <FontAwesome5 name="google" size={25} color="#DB4437" style={styles.googleIcon} />
              <Text style={styles.googleText}>تسجيل الدخول باستخدام جوجل</Text>
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.loginRow}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginText}>لديك حساب بالفعل؟ تسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const YELLOW = '#ffde9f';
const BROWN_DARK = '#2a1e1e';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  container: {
    flex: 1,
    backgroundColor: YELLOW,
  },
  headerArea: {
    height: '25%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: BROWN_DARK,
    fontSize: 32,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    writingDirection: 'rtl',
  },
  content: {
    paddingBottom: 32,
    alignItems: 'stretch',
  },
  typeSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  typeCard: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: BROWN_DARK,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  typeButton: {
    flex: 1,
    backgroundColor: BROWN_DARK,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  typeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  dividerRow: {
    marginVertical: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerLabel: {
    marginHorizontal: 12,
    color: BROWN_DARK,
    fontSize: 16,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: YELLOW,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 32,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleText: {
    color: BROWN_DARK,
    fontSize: 16,
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  loginRow: {
    alignItems: 'center',
  },
  loginText: {
    color: BROWN_DARK,
    fontFamily: 'NotoSansArabic_700Bold',
    fontSize: 16,
  },
});
