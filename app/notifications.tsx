import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BRAND_COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/Theme';
import { useAuthStore, useIsAuthenticated } from '../store/useAuthStore';
import { useAuthPrompt } from '../hooks/useAuthPrompt';
import AuthBottomSheet from '../components/AuthBottomSheet';
import { apiFetch } from '../utils/api';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const { authBottomSheetRef, customMessage, checkAuthAndPrompt } = useAuthPrompt();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: true,
    whatsapp: true,
  });
  const [loading, setLoading] = useState(false);
  const [animatingToggles, setAnimatingToggles] = useState<{[key: string]: Animated.Value}>({
    email: new Animated.Value(1),
    sms: new Animated.Value(1),
    whatsapp: new Animated.Value(1),
  });

  // Load user preferences on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadUserPreferences();
    }
  }, [isAuthenticated]);

  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/user/notification-preferences');
      if (response.success) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
      // Keep default preferences if loading fails
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!isAuthenticated) {
      checkAuthAndPrompt(
        () => {
          // User will be prompted to login
        },
        'يجب تسجيل الدخول لتعديل إعدادات الإشعارات'
      );
      return;
    }

    // Animate toggle immediately for smooth UX
    const toggleAnimation = animatingToggles[key];
    Animated.sequence([
      Animated.timing(toggleAnimation, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(toggleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Update local state immediately
    setPreferences(prev => ({ ...prev, [key]: value }));

    try {
      setLoading(true);
      
      const response = await apiFetch('/user/notification-preferences', {
        method: 'PUT',
        body: JSON.stringify({
          [key]: value,
        }),
      });

      if (!response.success) {
        // Revert on error
        setPreferences(prev => ({ ...prev, [key]: !value }));
        throw new Error(response.message || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Failed to update notification preference:', error);
      Alert.alert(
        'خطأ',
        'فشل في تحديث إعدادات الإشعارات. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNotificationSettings = () => {
    Alert.alert(
      'إعدادات الإشعارات',
      'لتمكين الإشعارات، يرجى الذهاب إلى إعدادات التطبيق والسماح بالإشعارات.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'فتح الإعدادات', onPress: () => {
          // This would open device notification settings
          console.log('Opening device notification settings...');
        }}
      ]
    );
  };

  const notificationChannels = [
    {
      id: 'email' as keyof NotificationPreferences,
      title: 'البريد الإلكتروني',
      icon: 'email',
      description: 'تلقي الإشعارات عبر البريد الإلكتروني',
    },
    {
      id: 'sms' as keyof NotificationPreferences,
      title: 'رسائل نصية',
      icon: 'message',
      description: 'تلقي الإشعارات عبر الرسائل النصية',
    },
    {
      id: 'whatsapp' as keyof NotificationPreferences,
      title: 'واتساب',
      icon: 'chat',
      description: 'تلقي الإشعارات عبر واتساب',
    },
  ];

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الإشعارات</Text>
          <View style={styles.placeholder} />
        </View>

        {/* App Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>إشعارات التطبيق</Text>
          </View>
          <View style={styles.sectionContent}>
            <TouchableOpacity 
              style={styles.settingsLink}
              onPress={handleOpenNotificationSettings}
            >
              <Text style={styles.settingsLinkText}>فتح إعدادات الإشعارات</Text>
            </TouchableOpacity>
            <Text style={styles.sectionDescription}>
              لا تفوت أي رسالة، اضغط على الرابط أدناه لتمكين الإشعارات منا بسهولة.
            </Text>
          </View>
        </View>

        {/* Marketing Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>تفضيلات التسويق</Text>
          </View>
          <View style={styles.sectionContent}>
            {notificationChannels.map((channel) => (
              <Animated.View 
                key={channel.id} 
                style={[
                  styles.channelItem,
                  { 
                    transform: [{ scale: animatingToggles[channel.id] }],
                    opacity: loading ? 0.7 : 1,
                  }
                ]}
              >
                <View style={styles.channelLeft}>
                  <View style={styles.channelIcon}>
                    <MaterialIcons 
                      name={channel.icon as any} 
                      size={20} 
                      color={BRAND_COLORS.primary} 
                    />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelTitle}>{channel.title}</Text>
                    <Text style={styles.channelDescription}>{channel.description}</Text>
                  </View>
                </View>
                <Switch
                  value={preferences[channel.id]}
                  onValueChange={(value) => updatePreference(channel.id, value)}
                  trackColor={{
                    false: BRAND_COLORS.gray[300],
                    true: `${BRAND_COLORS.primary}30`,
                  }}
                  thumbColor={preferences[channel.id] ? BRAND_COLORS.primary : BRAND_COLORS.gray[400]}
                  disabled={loading || !isAuthenticated}
                  style={styles.smoothSwitch}
                />
              </Animated.View>
            ))}
            <Text style={styles.disclaimer}>
              إلغاء الاشتراك يوقف الرسائل الترويجية، لكنك ستستمر في تلقي تحديثات الخدمة المهمة.
            </Text>
          </View>
        </View>

        {/* Authentication Prompt */}
        {!isAuthenticated && (
          <View style={styles.authPrompt}>
            <View style={styles.authPromptIcon}>
              <MaterialIcons name="lock" size={24} color={BRAND_COLORS.primary} />
            </View>
            <Text style={styles.authPromptTitle}>تسجيل الدخول مطلوب</Text>
            <Text style={styles.authPromptDescription}>
              يجب تسجيل الدخول لتخصيص إعدادات الإشعارات الخاصة بك
            </Text>
            <TouchableOpacity 
              style={styles.authPromptButton}
              onPress={() => checkAuthAndPrompt(
                () => router.push('/login' as any),
                'تسجيل الدخول لتخصيص إعدادات الإشعارات'
              )}
            >
              <Text style={styles.authPromptButtonText}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Auth Bottom Sheet */}
      <AuthBottomSheet
        bottomSheetRef={authBottomSheetRef}
        message={customMessage}
      />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  sectionContent: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    overflow: 'hidden',
  },
  settingsLink: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  settingsLinkText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.primary,
    textAlign: 'right',
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    lineHeight: 20,
    padding: SPACING.lg,
    textAlign: 'right',
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  channelInfo: {
    flex: 1,
  },
  channelTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    marginBottom: 2,
  },
  channelDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
  },
  disclaimer: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
    lineHeight: 16,
    padding: SPACING.lg,
    textAlign: 'right',
  },
  authPrompt: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    alignItems: 'center',
  },
  authPromptIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${BRAND_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  authPromptTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  authPromptDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  authPromptButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  authPromptButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.white,
  },
  smoothSwitch: {
    transform: [{ scale: 1.1 }],
  },
});
