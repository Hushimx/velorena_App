import React, { useState } from 'react';
import { Stack } from 'expo-router';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const [selectedType, setSelectedType] = useState<'individual' | 'company' | null>(null);
  const router = useRouter();

  const handleTypeSelection = (type: 'individual' | 'company') => {
    setSelectedType(type);
    // Here you can navigate to the appropriate registration form
    console.log('Selected registration type:', type);
  };

  const handleGoogleSignIn = () => {
    console.log('Google sign in pressed');
  };

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

const TEAL_600 = '#1d7791';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TEAL_600,
  },
  container: {
    flex: 1,
    backgroundColor: TEAL_600,
  },
  headerArea: {
    height: '25%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
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
    backgroundColor: TEAL_600,
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
    backgroundColor: TEAL_600,
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
    fontWeight: '700',
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
    color: '#1d7791',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: TEAL_600,
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
    color: '#1d7791',
    fontSize: 16,
    fontWeight: '600',
  },
  loginRow: {
    alignItems: 'center',
  },
  loginText: {
    color: TEAL_600,
    fontWeight: '700',
    fontSize: 16,
  },
});
