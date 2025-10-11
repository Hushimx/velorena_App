import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import PasswordInput from '../components/inputs/PasswordInput';
import { BORDER_RADIUS, BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useAuthStore } from '../store/useAuthStore';
import { apiFetch, changePassword, formatApiError } from '../utils/api';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<{field: string, title: string, value: string} | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEditField = (field: string, title: string, currentValue: string) => {
    setEditingField({ field, title, value: currentValue });
    setTempValue(currentValue);
    setModalVisible(true);
  };

  const handleSaveField = async () => {
    if (!editingField || !tempValue.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال قيمة صحيحة');
      return;
    }

    try {
      setSaving(true);
      
      const response = await apiFetch('/user/update-profile', {
        method: 'PUT',
        body: JSON.stringify({
          [editingField.field]: tempValue,
        }),
      });

      if (response.success) {
        // Update local user state
        updateUser({ [editingField.field]: tempValue } as any);
        setModalVisible(false);
        Alert.alert('نجح', 'تم تحديث البيانات بنجاح ✓');
      } else {
        throw new Error(response.message || 'فشل في تحديث البيانات');
      }
    } catch (error: any) {
      const errorMessage = formatApiError(error);
      Alert.alert('خطأ', errorMessage || 'فشل في تحديث البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    setPasswordModalVisible(true);
  };

  const handleSubmitPasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('خطأ', 'الرجاء ملء جميع الحقول');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقتين');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('خطأ', 'يجب أن تحتوي كلمة المرور الجديدة على 8 أحرف على الأقل');
      return;
    }

    try {
      setSaving(true);
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      Alert.alert('نجح', 'تم تغيير كلمة المرور بنجاح ✓');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = formatApiError(error);
      Alert.alert('خطأ', errorMessage || 'فشل في تغيير كلمة المرور. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب',
      'سيتم توجيهك إلى صفحة حذف الحساب على الموقع الإلكتروني.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'متابعة',
          style: 'destructive',
          onPress: async () => {
            try {
              const url = 'https://qaads.net/delete_account';
              const supported = await Linking.canOpenURL(url);
              
              if (supported) {
                await Linking.openURL(url);
              } else {
                Alert.alert('خطأ', 'لا يمكن فتح الرابط');
              }
            } catch {
              Alert.alert('خطأ', 'فشل في فتح الرابط');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-forward" size={24} color={BRAND_COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <Text style={styles.profileName}>{user?.full_name || 'المستخدم'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
            
            {/* Email - Read Only */}
            <View style={styles.fieldItem}>
              <MaterialIcons name="email" size={20} color={BRAND_COLORS.primary} />
              <View style={styles.fieldText}>
                <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
                <Text style={styles.fieldValue}>{user?.email || 'غير محدد'}</Text>
              </View>
            </View>

            {/* Full Name - Editable */}
            <View style={styles.fieldItem}>
              <MaterialIcons name="person" size={20} color={BRAND_COLORS.primary} />
              <View style={styles.fieldText}>
                <Text style={styles.fieldLabel}>الاسم الكامل</Text>
                <Text style={styles.fieldValue}>{user?.full_name || 'غير محدد'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditField('full_name', 'الاسم الكامل', user?.full_name || '')}
              >
                <MaterialIcons name="edit" size={18} color={BRAND_COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Phone - Show Only */}
            <View style={styles.fieldItem}>
              <MaterialIcons name="phone" size={20} color={BRAND_COLORS.primary} />
              <View style={styles.fieldText}>
                <Text style={styles.fieldLabel}>رقم الهاتف</Text>
                <Text style={styles.fieldValue}>{user?.phone || 'غير محدد'}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="check-circle" size={16} color={BRAND_COLORS.success} />
                <Text style={styles.verifiedText}>متحقق</Text>
              </View>
            </View>
          </View>

          {/* Security Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>الأمان</Text>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleChangePassword}>
              <View style={styles.actionLeft}>
                <MaterialIcons name="lock-outline" size={22} color={BRAND_COLORS.primary} />
                <Text style={styles.actionText}>تغيير كلمة المرور</Text>
              </View>
              <MaterialIcons name="chevron-left" size={22} color={BRAND_COLORS.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: BRAND_COLORS.error }]}>منطقة الخطر</Text>
            
            <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
              <MaterialIcons name="delete-forever" size={22} color={BRAND_COLORS.error} />
              <Text style={styles.dangerText}>حذف الحساب</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Edit Field Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !saving && setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingField?.title}</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                disabled={saving}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={BRAND_COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={tempValue}
              onChangeText={setTempValue}
              placeholder={`أدخل ${editingField?.title}`}
              placeholderTextColor={BRAND_COLORS.text.tertiary}
              autoFocus
              editable={!saving}
              textAlign="right"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSaveField}
                disabled={saving}
              >
                {saving ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>جاري الحفظ...</Text>
                    <ActivityIndicator size="small" color={BRAND_COLORS.white} />
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>حفظ</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, saving && styles.buttonDisabled]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setPasswordModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !saving && setPasswordModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
              <TouchableOpacity 
                onPress={() => setPasswordModalVisible(false)}
                disabled={saving}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={BRAND_COLORS.text.secondary} />
              </TouchableOpacity>
            </View>

            <PasswordInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="كلمة المرور الحالية"
            />

            <View style={{ marginTop: SPACING.md }}>
              <PasswordInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="كلمة المرور الجديدة"
              />
            </View>

            <View style={{ marginTop: SPACING.md }}>
              <PasswordInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="تأكيد كلمة المرور الجديدة"
              />
            </View>

            <View style={[styles.modalActions, { marginTop: SPACING.xl }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSubmitPasswordChange}
                disabled={saving}
              >
                {saving ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>جاري التغيير...</Text>
                    <ActivityIndicator size="small" color={BRAND_COLORS.white} />
                  </View>
                ) : (
                  <Text style={styles.saveButtonText}>تغيير</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, saving && styles.buttonDisabled]}
                onPress={() => setPasswordModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: BRAND_COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING['3xl'],
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: BRAND_COLORS.background.primary,
    marginBottom: SPACING.md,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: BRAND_COLORS.background.primary,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.lg,
    textAlign: 'right',
  },
  fieldItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  fieldText: {
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
    flex: 1,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
    marginBottom: 2,
    textAlign: 'right',
  },
  fieldValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    textAlign: 'right',
  },
  editButton: {
    padding: SPACING.sm,
  },
  verifiedBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: `${BRAND_COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.success,
    marginRight: SPACING.xs,
  },
  actionItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  actionLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  actionText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.primary,
    marginLeft: SPACING.md,
    textAlign: 'right',
  },
  dangerItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: `${BRAND_COLORS.error}10`,
    paddingHorizontal: SPACING.lg,
  },
  dangerText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.error,
    marginLeft: SPACING.md,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: BRAND_COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.xl,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    gap: SPACING.md,
  },
  modalButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: BRAND_COLORS.gray[100],
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.secondary,
  },
  saveButton: {
    backgroundColor: BRAND_COLORS.primary,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
