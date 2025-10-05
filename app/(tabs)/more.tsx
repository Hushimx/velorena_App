import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking
} from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useAuthStore, useIsAuthenticated } from '../../store/useAuthStore';
import { useAuthPrompt } from '../../hooks/useAuthPrompt';
import AuthBottomSheet from '../../components/AuthBottomSheet';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const isAuthenticated = useIsAuthenticated();
  const { authBottomSheetRef, customMessage, checkAuthAndPrompt } = useAuthPrompt();

  const handleWhatsAppPress = () => {
    const phoneNumber = '966531212380';
    const message = 'مرحباً، أود الاستفسار عن خدماتكم';
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open WhatsApp:', err);
    });
  };

  // Quick access cards data
  const quickAccessCards = [
    {
      id: 'orders',
      title: 'طلباتي',
      subtitle: isAuthenticated ? 'إدارة وتتبع' : 'تسجيل الدخول مطلوب',
      icon: 'shopping-bag',
      onPress: () => checkAuthAndPrompt(
        () => router.push('/orders' as any),
        'يجب تسجيل الدخول لعرض طلباتك'
      ),
      requiresAuth: true,
    },
    {
      id: 'appointments',
      title: 'مواعيدي',
      subtitle: isAuthenticated ? '0 موعد نشط' : 'تسجيل الدخول مطلوب',
      icon: 'event',
      onPress: () => checkAuthAndPrompt(
        () => router.push('/appointments' as any),
        'يجب تسجيل الدخول لعرض مواعيدك'
      ),
      requiresAuth: true,
    },
    {
      id: 'designs',
      title: 'تصاميمي',
      subtitle: isAuthenticated ? '2 تصميم محفوظ' : 'تسجيل الدخول مطلوب',
      icon: 'palette',
      onPress: () => checkAuthAndPrompt(
        () => router.push('/designs' as any),
        'يجب تسجيل الدخول لعرض تصاميمك'
      ),
      requiresAuth: true,
    },
  ];

  // Account menu items - Protected items
  const protectedMenuItems = [
    {
      id: 'addresses',
      title: 'العناوين',
      icon: 'location-on',
      onPress: () => checkAuthAndPrompt(
        () => router.push('/addresses' as any),
        'يجب تسجيل الدخول لإدارة عناوينك'
      ),
    },
    {
      id: 'account-settings',
      title: 'إعدادات الحساب',
      icon: 'account-circle',
      onPress: () => checkAuthAndPrompt(
        () => router.push('/account-settings' as any),
        'يجب تسجيل الدخول للوصول لإعدادات الحساب'
      ),
    },
  ];

  // Guest accessible items
  const guestMenuItems = [
    {
      id: 'support',
      title: 'الدعم الفني',
      icon: 'headset',
      onPress: () => router.push('/support' as any),
    },
    {
      id: 'privacy',
      title: 'سياسة الخصوصية',
      icon: 'privacy-tip',
      onPress: () => router.push('/privacy' as any),
    },
    {
      id: 'terms',
      title: 'شروط الاستخدام',
      icon: 'description',
      onPress: () => router.push('/terms' as any),
    },
    {
      id: 'notifications',
      title: 'الإشعارات',
      icon: 'notifications',
      onPress: () => router.push('/notifications' as any),
    },
    {
      id: 'test-notifications',
      title: 'اختبار الإشعارات',
      icon: 'notifications-active',
      onPress: () => router.push('/test-notifications' as any),
    },
  ];


  return (
    <SafeAreaWrapper backgroundColor={BRAND_COLORS.background.primary} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          {isAuthenticated ? (
            <>
              <View style={styles.profileHeader}>

                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>
                    {user?.full_name || 'المستخدم'}
                  </Text>
                  <Text style={styles.userEmail}>
                    {user?.email || ''}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => router.push('/account-settings' as any)}
                >
                  <Text style={styles.editButtonText}>تعديل</Text>
                </TouchableOpacity>
              </View>
              
              {/* Profile Completion */}

            </>
          ) : (
            /* Guest Profile Section */
            <View style={styles.guestProfileSection}>
              <View style={styles.guestAvatarContainer}>
                <View style={styles.guestAvatar}>
                  <MaterialIcons name="person" size={32} color={BRAND_COLORS.gray[400]} />
                </View>
              </View>
              <View style={styles.guestInfo}>
                <Text style={styles.guestTitle}>مرحباً بك في فيلورينا</Text>
                <Text style={styles.guestSubtitle}>
                  سجل الدخول للوصول إلى جميع الميزات
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => checkAuthAndPrompt(
                  () => router.push('/login' as any),
                  'تسجيل الدخول للوصول إلى جميع الميزات'
                )}
              >
                <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Access Cards Grid */}
        <View style={styles.cardsSection}>
          <View style={styles.cardsGrid}>
            {quickAccessCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.quickCard}
                onPress={card.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.cardIcon}>
                  <MaterialIcons name={card.icon as any} size={24} color={BRAND_COLORS.primary} />
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Account Section */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>
            {isAuthenticated ? 'حسابي' : 'الإعدادات'}
          </Text>
          <View style={styles.menuContainer}>
            {isAuthenticated ? (
              /* Show protected menu items for authenticated users */
              protectedMenuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIcon}>
                      <MaterialIcons name={item.icon as any} size={20} color={BRAND_COLORS.primary} />
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  <MaterialIcons name="chevron-left" size={20} color={BRAND_COLORS.text.tertiary} />
                </TouchableOpacity>
              ))
            ) : null}
            
            {/* Show guest accessible items for all users */}
            {guestMenuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIcon}>
                    <MaterialIcons name={item.icon as any} size={20} color={BRAND_COLORS.primary} />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <MaterialIcons name="chevron-left" size={20} color={BRAND_COLORS.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Help Button */}
        <View style={styles.helpSection}>
          <TouchableOpacity style={styles.helpButton}>
            <MaterialIcons name="help-outline" size={20} color={BRAND_COLORS.white} />
            <Text style={styles.helpButtonText}>تحتاج مساعدة؟</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {user && (
          <View style={styles.logoutSection}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => {
                logout();
                router.replace('/login');
              }}
            >
              <MaterialIcons name="logout" size={20} color={BRAND_COLORS.error} />
              <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      {/* WhatsApp Floating Button */}
      <TouchableOpacity 
        style={styles.whatsappButton}
        onPress={handleWhatsAppPress}
        activeOpacity={0.8}
      >
        <MaterialIcons name="chat" size={24} color={BRAND_COLORS.white} />
      </TouchableOpacity>
      
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
    direction: 'rtl',
    },
  scrollView: {
    flex: 1,
  },
  
  // Profile Section
  profileSection: {
    backgroundColor: BRAND_COLORS.background.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    justifyContent: 'space-between',
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND_COLORS.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  userEmail: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    writingDirection: 'rtl',
  },
  editButton: {
    backgroundColor: BRAND_COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
    writingDirection: 'rtl',
  },
  
  // Guest Profile Section
  guestProfileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  guestAvatarContainer: {
    marginBottom: SPACING.lg,
  },
  guestAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRAND_COLORS.gray[200],
  },
  guestInfo: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  guestTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  guestSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    writingDirection: 'rtl',
  },
  loginButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.lg,
    borderRadius: 25,
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.white,
    writingDirection: 'rtl',
  },
  
  // Profile Completion
  profileCompletion: {
    marginTop: SPACING.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: BRAND_COLORS.gray[200],
    borderRadius: 3,
    marginRight: SPACING.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_COLORS.secondary,
    borderRadius: 3,
  },
  progressBadge: {
    backgroundColor: BRAND_COLORS.secondary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  progressText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  completionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
  },
  
  // Quick Access Cards
  cardsSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickCard: {
    width: '48%',
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BRAND_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 2,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  
  // Account Section
  accountSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.lg,
    writingDirection: 'rtl',
  },
  menuContainer: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${BRAND_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.md,
  },
  menuItemText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    writingDirection: 'rtl',
  },
  
  // Help Section
  helpSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  helpButton: {
    backgroundColor: BRAND_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.white,
    marginRight: SPACING.sm,
    writingDirection: 'rtl',
  },
  
  // Logout Section
  logoutSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  logoutButton: {
    backgroundColor: BRAND_COLORS.background.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.error,
  },
  logoutButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.error,
    marginRight: SPACING.sm,
    writingDirection: 'rtl',
  },
  
  // WhatsApp Floating Button
  whatsappButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
});
