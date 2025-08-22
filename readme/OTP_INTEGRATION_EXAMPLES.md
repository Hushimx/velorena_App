# OTP Integration Examples

This document provides examples of how to integrate the OTP authentication system into your React Native Expo app.

## 🚀 Basic Usage Examples

### 1. Using the OTP Screen Directly

```typescript
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();
  
  const handleOtpVerification = () => {
    router.push('/otp');
  };
  
  return (
    <TouchableOpacity onPress={handleOtpVerification}>
      <Text>Verify with OTP</Text>
    </TouchableOpacity>
  );
}
```

### 2. Integration with Login Flow

```typescript
// In your login screen
import { useAuthStore } from '../store/useAuthStore';
import { sendOtp } from '../utils/api';

function LoginScreen() {
  const { setOtpData } = useAuthStore();
  const router = useRouter();
  
  const handleLoginWithOtp = async (email: string) => {
    try {
      const response = await sendOtp(email, 'email');
      if (response.otpId) {
        setOtpData(response.otpId, email, 'email', response.expiresAt);
        router.push('/otp');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إرسال رمز التحقق');
    }
  };
}
```

### 3. Integration with Registration Flow

```typescript
// After successful registration
import { useAuthStore } from '../store/useAuthStore';
import { sendOtp } from '../utils/api';

function RegistrationScreen() {
  const { setOtpData } = useAuthStore();
  const router = useRouter();
  
  const handleRegistrationComplete = async (userData: any) => {
    try {
      // First register the user
      const registerResponse = await registerUser(userData);
      
      // Then send OTP for verification
      const otpResponse = await sendOtp(userData.email, 'email');
      
      if (otpResponse.otpId) {
        setOtpData(otpResponse.otpId, userData.email, 'email', otpResponse.expiresAt);
        router.push('/otp');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في التسجيل');
    }
  };
}
```

## 🔧 Advanced Integration Patterns

### 1. Custom OTP Component

```typescript
import { useAuthStore, useOtpData } from '../store/useAuthStore';
import { sendOtp, verifyOtp } from '../utils/api';

function CustomOtpComponent() {
  const [code, setCode] = useState('');
  const { setOtpData, setOtpVerified, isLoading, setLoading } = useAuthStore();
  const otpData = useOtpData();
  
  const handleSendOtp = async (identifier: string, type: 'email' | 'sms' | 'whatsapp') => {
    setLoading(true);
    try {
      const response = await sendOtp(identifier, type);
      if (response.otpId) {
        setOtpData(response.otpId, identifier, type, response.expiresAt);
        Alert.alert('تم الإرسال', 'تم إرسال رمز التحقق');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOtp = async () => {
    if (!otpData.otpIdentifier || !otpData.otpType) return;
    
    setLoading(true);
    try {
      const response = await verifyOtp(otpData.otpIdentifier, code, otpData.otpType);
      if (response.isVerified) {
        setOtpVerified(true);
        Alert.alert('نجح', 'تم التحقق بنجاح');
      }
    } catch (error) {
      Alert.alert('خطأ', 'الرمز غير صالح');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="أدخل رمز التحقق"
        keyboardType="number-pad"
      />
      <TouchableOpacity onPress={handleVerifyOtp} disabled={isLoading}>
        <Text>{isLoading ? 'جاري التحقق...' : 'تحقق'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 2. OTP Status Hook

```typescript
// Custom hook for OTP status
function useOtpStatus() {
  const otpData = useOtpData();
  const isLoading = useAuthLoading();
  
  return {
    isOtpSent: !!otpData.otpId,
    isOtpVerified: otpData.isOtpVerified,
    isLoading,
    otpType: otpData.otpType,
    otpIdentifier: otpData.otpIdentifier,
    canResend: !isLoading && !!otpData.otpId,
  };
}

// Usage in component
function MyComponent() {
  const { isOtpSent, isOtpVerified, canResend } = useOtpStatus();
  
  if (isOtpVerified) {
    return <Text>تم التحقق ✅</Text>;
  }
  
  if (isOtpSent) {
    return <OtpVerificationForm />;
  }
  
  return <OtpSendForm />;
}
```

### 3. Protected Route with OTP Verification

```typescript
import { useIsOtpVerified } from '../store/useAuthStore';

function ProtectedScreen() {
  const isOtpVerified = useIsOtpVerified();
  const router = useRouter();
  
  useEffect(() => {
    if (!isOtpVerified) {
      Alert.alert(
        'التحقق مطلوب',
        'يجب التحقق من الهوية للوصول لهذه الصفحة',
        [
          {
            text: 'التحقق الآن',
            onPress: () => router.push('/otp')
          }
        ]
      );
    }
  }, [isOtpVerified]);
  
  if (!isOtpVerified) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>يجب التحقق من الهوية أولاً</Text>
      </View>
    );
  }
  
  return <YourProtectedContent />;
}
```

## 📱 UI Integration Examples

### 1. Add OTP Button to Login Screen

```typescript
// In your existing login screen
<TouchableOpacity 
  style={styles.otpButton}
  onPress={() => router.push('/otp')}
>
  <MaterialIcons name="security" size={20} color="#E9C318" />
  <Text style={styles.otpButtonText}>تسجيل الدخول برمز التحقق</Text>
</TouchableOpacity>
```

### 2. Add OTP Verification Status to Profile

```typescript
import { useIsOtpVerified } from '../store/useAuthStore';

function ProfileScreen() {
  const isOtpVerified = useIsOtpVerified();
  
  return (
    <View>
      <View style={styles.verificationStatus}>
        <MaterialIcons 
          name={isOtpVerified ? "verified" : "warning"} 
          size={24} 
          color={isOtpVerified ? "#10b981" : "#f59e0b"} 
        />
        <Text style={styles.statusText}>
          {isOtpVerified ? 'تم التحقق من الحساب' : 'الحساب غير محقق'}
        </Text>
        {!isOtpVerified && (
          <TouchableOpacity onPress={() => router.push('/otp')}>
            <Text style={styles.verifyButton}>تحقق الآن</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
```

## 🔄 State Management Examples

### 1. Clear OTP Data on App Background

```typescript
import { AppState } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

function App() {
  const { clearOtpData } = useAuthStore();
  
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        // Clear sensitive OTP data when app goes to background
        clearOtpData();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
}
```

### 2. Auto-clear OTP after Expiration

```typescript
function useOtpExpiration() {
  const { otpExpiresAt, clearOtpData } = useAuthStore();
  
  useEffect(() => {
    if (!otpExpiresAt) return;
    
    const expirationTime = new Date(otpExpiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;
    
    if (timeUntilExpiration <= 0) {
      clearOtpData();
      return;
    }
    
    const timer = setTimeout(() => {
      clearOtpData();
      Alert.alert('انتهت الصلاحية', 'انتهت صلاحية رمز التحقق');
    }, timeUntilExpiration);
    
    return () => clearTimeout(timer);
  }, [otpExpiresAt]);
}
```

## 🛡️ Security Best Practices

### 1. Rate Limiting Handling

```typescript
const handleSendOtp = async () => {
  try {
    await sendOtp(identifier, type);
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      Alert.alert(
        'تم تجاوز الحد المسموح',
        'تم إرسال الكثير من الطلبات. يرجى المحاولة بعد 15 دقيقة'
      );
      // Disable send button for 15 minutes
      setCanSend(false);
      setTimeout(() => setCanSend(true), 15 * 60 * 1000);
    }
  }
};
```

### 2. Input Validation

```typescript
const validateOtpCode = (code: string): boolean => {
  // Remove any non-digit characters
  const cleanCode = code.replace(/\D/g, '');
  
  // Check length (typically 4-6 digits)
  if (cleanCode.length < 4 || cleanCode.length > 6) {
    Alert.alert('خطأ', 'رمز التحقق يجب أن يكون بين 4-6 أرقام');
    return false;
  }
  
  return true;
};
```

### 3. Secure Storage for Sensitive Data

```typescript
// Only store non-sensitive data in AsyncStorage
// Sensitive data like actual OTP codes should never be stored
const secureOtpFlow = {
  // ✅ Safe to store
  otpId: 'unique-otp-session-id',
  isVerified: false,
  
  // ❌ Never store
  // actualOtpCode: '123456', // Never store the actual code
  // userPassword: 'password', // Never store passwords
};
```

## 🧪 Testing Examples

### 1. Mock OTP API for Development

```typescript
// Create a mock version for development
const mockSendOtp = async (identifier: string, type: 'email' | 'sms' | 'whatsapp') => {
  if (__DEV__) {
    console.log(`Mock OTP sent to ${identifier} via ${type}: 123456`);
    return {
      success: true,
      message: 'تم إرسال رمز التحقق',
      otpId: 'mock-otp-id-' + Date.now(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }
  return sendOtp(identifier, type);
};
```

### 2. Test Component

```typescript
// Example test component for development
function OtpTestComponent() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>OTP System Test</Text>
      
      <TouchableOpacity 
        style={styles.testButton}
        onPress={() => router.push('/otp')}
      >
        <Text>Test OTP Screen</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.testButton}
        onPress={() => {
          const { clearOtpData } = useAuthStore.getState();
          clearOtpData();
          Alert.alert('تم', 'تم مسح بيانات OTP');
        }}
      >
        <Text>Clear OTP Data</Text>
      </TouchableOpacity>
    </View>
  );
}
```

This comprehensive integration guide shows you how to use the OTP system in various scenarios within your React Native Expo app. The system is designed to be flexible and can be integrated into any authentication flow you need.
