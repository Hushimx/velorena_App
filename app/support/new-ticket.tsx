import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useSupportStore } from '../../store/useSupportStore';
import { SupportTicketCategory, SupportTicketPriority } from '../../utils/api';

export default function NewTicketScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createTicket } = useSupportStore();

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium' as SupportTicketPriority,
    category: 'general' as SupportTicketCategory,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const priorities: { value: SupportTicketPriority; label: string; color: string }[] = [
    { value: 'low', label: 'منخفض', color: BRAND_COLORS.success },
    { value: 'medium', label: 'متوسط', color: BRAND_COLORS.warning },
    { value: 'high', label: 'عالي', color: '#ff6b35' },
    { value: 'urgent', label: 'عاجل', color: BRAND_COLORS.error },
  ];

  const categories: { value: SupportTicketCategory; label: string; icon: string }[] = [
    { value: 'general', label: 'عام', icon: 'help-outline' },
    { value: 'technical', label: 'تقني', icon: 'build' },
    { value: 'billing', label: 'الفوترة', icon: 'payment' },
    { value: 'feature_request', label: 'طلب ميزة', icon: 'lightbulb-outline' },
    { value: 'bug_report', label: 'تقرير خطأ', icon: 'bug-report' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'الموضوع مطلوب';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'الموضوع يجب أن يكون 5 أحرف على الأقل';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'الوصف مطلوب';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'الوصف يجب أن يكون 10 أحرف على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const newTicket = await createTicket({
        subject: formData.subject.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category: formData.category,
      });

      if (newTicket) {
        Alert.alert(
          'تم إنشاء التذكرة',
          'تم إنشاء تذكرة الدعم بنجاح. سنقوم بالرد عليك في أقرب وقت ممكن.',
          [
            {
              text: 'موافق',
              onPress: () => router.replace('/support'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء التذكرة. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <MaterialIcons name="arrow-back" size={24} color={BRAND_COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>تذكرة دعم جديدة</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Subject */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الموضوع *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.subject && styles.textInputError
                ]}
                value={formData.subject}
                onChangeText={(text) => updateFormData('subject', text)}
                placeholder="اكتب موضوع التذكرة..."
                placeholderTextColor={BRAND_COLORS.text.tertiary}
                maxLength={255}
              />
              {errors.subject && (
                <Text style={styles.errorText}>{errors.subject}</Text>
              )}
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>التصنيف *</Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryItem,
                      formData.category === category.value && styles.categoryItemSelected
                    ]}
                    onPress={() => updateFormData('category', category.value)}
                  >
                    <MaterialIcons
                      name={category.icon as any}
                      size={24}
                      color={
                        formData.category === category.value
                          ? BRAND_COLORS.primary
                          : BRAND_COLORS.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        formData.category === category.value && styles.categoryTextSelected
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الأولوية *</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityItem,
                      formData.priority === priority.value && styles.priorityItemSelected
                    ]}
                    onPress={() => updateFormData('priority', priority.value)}
                  >
                    <View
                      style={[
                        styles.priorityIndicator,
                        { backgroundColor: priority.color }
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        formData.priority === priority.value && styles.priorityTextSelected
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>الوصف *</Text>
              <TextInput
                style={[
                  styles.textArea,
                  errors.description && styles.textInputError
                ]}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="اكتب وصفاً مفصلاً للمشكلة أو الطلب..."
                placeholderTextColor={BRAND_COLORS.text.tertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={5000}
              />
              {errors.description && (
                <Text style={styles.errorText}>{errors.description}</Text>
              )}
              <Text style={styles.characterCount}>
                {formData.description.length}/5000
              </Text>
            </View>

            {/* Tips */}
            <View style={styles.tipsContainer}>
              <MaterialIcons name="lightbulb-outline" size={20} color={BRAND_COLORS.warning} />
              <View style={styles.tipsContent}>
                <Text style={styles.tipsTitle}>نصائح لكتابة تذكرة فعالة:</Text>
                <Text style={styles.tipsText}>
                  • كن واضحاً ومحدداً في وصف المشكلة{'\n'}
                  • اذكر الخطوات التي قمت بها لحل المشكلة{'\n'}
                  • أرفق لقطات شاشة إذا كانت مفيدة{'\n'}
                  • اذكر متى بدأت المشكلة
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={BRAND_COLORS.text.inverse} />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color={BRAND_COLORS.text.inverse} />
                  <Text style={styles.submitButtonText}>إرسال التذكرة</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
    direction: 'rtl',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: BRAND_COLORS.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${BRAND_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  textInput: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  textArea: {
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    backgroundColor: BRAND_COLORS.background.primary,
    minHeight: 120,
  },
  textInputError: {
    borderColor: BRAND_COLORS.error,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.error,
    marginTop: SPACING.xs,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
    textAlign: 'left',
    marginTop: SPACING.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  categoryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  categoryItemSelected: {
    borderColor: BRAND_COLORS.primary,
    backgroundColor: `${BRAND_COLORS.primary}10`,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: BRAND_COLORS.primary,
  },
  priorityContainer: {
    gap: SPACING.sm,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  priorityItemSelected: {
    borderColor: BRAND_COLORS.primary,
    backgroundColor: `${BRAND_COLORS.primary}10`,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  priorityTextSelected: {
    color: BRAND_COLORS.primary,
  },
  tipsContainer: {
    flexDirection: 'row',
    backgroundColor: `${BRAND_COLORS.warning}15`,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: `${BRAND_COLORS.warning}30`,
  },
  tipsContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  tipsTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.warning,
    marginBottom: SPACING.xs,
  },
  tipsText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    lineHeight: 20,
  },
  submitContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border.primary,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.inverse,
  },
});

