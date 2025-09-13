import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useAuthStore } from '../../store/useAuthStore';

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const menuItems = [
    {
      id: 'profile',
      title: 'الملف الشخصي',
      icon: 'user',
      onPress: () => router.push('/profile' as any),
    },
    {
      id: 'orders',
      title: 'طلباتي',
      icon: 'shopping-bag',
      onPress: () => router.push('/orders' as any),
    },
    {
      id: 'appointments',
      title: 'مواعيدي',
      icon: 'event',
      onPress: () => router.push('/appointments' as any),
    },
    {
      id: 'designs',
      title: 'تصاميمي',
      icon: 'palette',
      onPress: () => router.push('/designs' as any),
    },
    {
      id: 'settings',
      title: 'الإعدادات',
      icon: 'settings',
      onPress: () => router.push('/settings' as any),
    },
    {
      id: 'support',
      title: 'الدعم الفني',
      icon: 'headset',
      onPress: () => router.push('/support' as any),
    },
    {
      id: 'about',
      title: 'حول التطبيق',
      icon: 'info',
      onPress: () => router.push('/about' as any),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>المزيد</Text>
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.name || user.first_name || 'مستخدم'}
              </Text>
              <Text style={styles.userType}>
                {user.user_type === 'company' ? 'حساب شركة' : 'حساب فردي'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color={BRAND_COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Items */}
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name={item.icon as any} size={24} color={BRAND_COLORS.primary} />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <MaterialIcons name="chevron-left" size={20} color={BRAND_COLORS.text.tertiary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    direction: 'rtl',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: BRAND_COLORS.background.primary,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: 16,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: BRAND_COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 4,
  },
  userType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  menuItem: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuItemText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
  },
});
