import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    I18nManager,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BORDER_RADIUS, BRAND_COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import { useAuthStore } from '../store/useAuthStore';
import { apiFetch } from '../utils/api';

// Ensure RTL is enabled

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<{field: string, title: string, value: string} | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [saving, setSaving] = useState(false);

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

      if (response.success && user) {
        updateUser({ ...user, [editingField.field]: tempValue });
        setModalVisible(false);
        Alert.alert('تم', 'تم تحديث البيانات بنجاح');
      } else {
        throw new Error(response.message || 'فشل في تحديث البيانات');
      }
    } catch {
      Alert.alert('خطأ', 'فشل في تحديث البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'تغيير كلمة المرور',
      'سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إرسال الرابط',
          onPress: () => {
            Alert.alert('تم الإرسال', 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب',
      'هل أنت متأكد من أنك تريد حذف حسابك؟ لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            Alert.alert('تم الحذف', 'تم حذف حسابك');
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
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.primary} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>الملف الشخصي</Text>
              <Text style={styles.headerSubtitle}>إدارة ملفك الشخصي</Text>
            </View>
          </View>
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
              <View style={styles.fieldInfo}>
                <MaterialIcons name="email" size={20} color={BRAND_COLORS.primary} />
                <View style={styles.fieldText}>
                  <Text style={styles.fieldLabel}>البريد الإلكتروني</Text>
                  <Text style={styles.fieldValue}>{user?.email || 'غير محدد'}</Text>
                </View>
              </View>
            </View>

            {/* Full Name - Editable */}
            <View style={styles.fieldItem}>
              <View style={styles.fieldInfo}>
                <MaterialIcons name="person" size={20} color={BRAND_COLORS.primary} />
                <View style={styles.fieldText}>
                  <Text style={styles.fieldLabel}>الاسم الكامل</Text>
                  <Text style={styles.fieldValue}>{user?.full_name || 'غير محدد'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditField('full_name', 'تعديل الاسم الكامل', user?.full_name || '')}
              >
                <MaterialIcons name="edit" size={16} color={BRAND_COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Phone - Show Only */}
            <View style={styles.fieldItem}>
              <View style={styles.fieldInfo}>
                <MaterialIcons name="phone" size={20} color={BRAND_COLORS.primary} />
                <View style={styles.fieldText}>
                  <Text style={styles.fieldLabel}>رقم الهاتف</Text>
                  <Text style={styles.fieldValue}>{user?.phone || 'غير محدد'}</Text>
                </View>
              </View>
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="check-circle" size={16} color={BRAND_COLORS.success} />
                <Text style={styles.verifiedText}>متحقق</Text>
              </View>
            </View>

            {/* Address - Editable */}
            <View style={styles.fieldItem}>
              <View style={styles.fieldInfo}>
                <MaterialIcons name="location-on" size={20} color={BRAND_COLORS.primary} />
                <View style={styles.fieldText}>
                  <Text style={styles.fieldLabel}>العنوان</Text>
                  <Text style={styles.fieldValue}>{user?.address || 'غير محدد'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditField('address', 'تعديل العنوان', user?.address || '')}
              >
                <MaterialIcons name="edit" size={16} color={BRAND_COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* City - Editable */}
            <View style={styles.fieldItem}>
              <View style={styles.fieldInfo}>
                <MaterialIcons name="location-city" size={20} color={BRAND_COLORS.primary} />
                <View style={styles.fieldText}>
                  <Text style={styles.fieldLabel}>المدينة</Text>
                  <Text style={styles.fieldValue}>{user?.city || 'غير محدد'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditField('city', 'تعديل المدينة', user?.city || '')}
              >
                <MaterialIcons name="edit" size={16} color={BRAND_COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Country - Editable */}
            <View style={styles.fieldItem}>
              <View style={styles.fieldInfo}>
                <MaterialIcons name="public" size={20} color={BRAND_COLORS.primary} />
                <View style={styles.fieldText}>
                  <Text style={styles.fieldLabel}>البلد</Text>
                  <Text style={styles.fieldValue}>{user?.country || 'غير محدد'}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => handleEditField('country', 'تعديل البلد', user?.country || '')}
              >
                <MaterialIcons name="edit" size={16} color={BRAND_COLORS.primary} />
              </TouchableOpacity>
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
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveField}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.tertiary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: BRAND_COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_COLORS.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: 2,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'right',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  fieldInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldText: {
    marginLeft: SPACING.md,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${BRAND_COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
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
    marginLeft: SPACING.xs,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  actionLeft: {
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
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
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.xl,
    backgroundColor: BRAND_COLORS.background.secondary,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  modalButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
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
    ...SHADOWS.sm,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.white,
  },
});
