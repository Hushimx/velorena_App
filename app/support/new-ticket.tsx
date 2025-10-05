import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../constants/Theme';
import { useSupportStore } from '../../store/useSupportStore';
import { SupportTicketCategory, SupportTicketPriority } from '../../utils/api';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';

export default function NewTicketScreen() {
  const router = useRouter();
  const { createTicket } = useSupportStore();

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium' as SupportTicketPriority,
    category: 'general' as SupportTicketCategory,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const priorities: { value: SupportTicketPriority; label: string; color: string; icon: string }[] = [
    { value: 'low', label: 'Low', color: BRAND_COLORS.success, icon: 'flag' },
    { value: 'medium', label: 'Medium', color: BRAND_COLORS.warning, icon: 'flag' },
    { value: 'high', label: 'High', color: '#ff6b35', icon: 'flag' },
    { value: 'urgent', label: 'Urgent', color: BRAND_COLORS.error, icon: 'flag' },
  ];

  const categories: { value: SupportTicketCategory; label: string; icon: string; desc: string }[] = [
    { value: 'general', label: 'General', icon: 'help-outline', desc: 'General inquiries' },
    { value: 'technical', label: 'Technical', icon: 'build', desc: 'Technical issues' },
    { value: 'billing', label: 'Billing', icon: 'payment', desc: 'Payment & billing' },
    { value: 'feature_request', label: 'Feature', icon: 'lightbulb-outline', desc: 'New feature idea' },
    { value: 'bug_report', label: 'Bug', icon: 'bug-report', desc: 'Report a bug' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
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
          'Ticket Created',
          'Your support ticket has been created successfully. Our team will get back to you soon.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/support'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create ticket. Please try again.');
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
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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
                <Text style={styles.headerTitle}>New Support Ticket</Text>
                <Text style={styles.headerSubtitle}>We&apos;re here to help</Text>
              </View>
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
              <Text style={styles.sectionTitle}>Subject *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.subject && styles.textInputError
                ]}
                value={formData.subject}
                onChangeText={(text) => updateFormData('subject', text)}
                placeholder="Brief description of your issue"
                placeholderTextColor={BRAND_COLORS.text.tertiary}
                maxLength={255}
              />
              {errors.subject && (
                <Text style={styles.errorText}>{errors.subject}</Text>
              )}
            </View>

            {/* Category */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category *</Text>
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
                    <View style={[
                      styles.categoryIconContainer,
                      formData.category === category.value && styles.categoryIconContainerSelected
                    ]}>
                      <MaterialIcons
                        name={category.icon as any}
                        size={20}
                        color={
                          formData.category === category.value
                            ? BRAND_COLORS.primary
                            : BRAND_COLORS.text.secondary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        formData.category === category.value && styles.categoryTextSelected
                      ]}
                    >
                      {category.label}
                    </Text>
                    <Text style={styles.categoryDesc}>{category.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority *</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityItem,
                      formData.priority === priority.value && {
                        borderColor: priority.color,
                        backgroundColor: `${priority.color}10`,
                      }
                    ]}
                    onPress={() => updateFormData('priority', priority.value)}
                  >
                    <MaterialIcons 
                      name={priority.icon as any} 
                      size={18} 
                      color={priority.color} 
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        formData.priority === priority.value && { color: priority.color, fontFamily: TYPOGRAPHY.fontFamily.bold }
                      ]}
                    >
                      {priority.label}
                    </Text>
                    {formData.priority === priority.value && (
                      <MaterialIcons name="check-circle" size={18} color={priority.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description *</Text>
              <TextInput
                style={[
                  styles.textArea,
                  errors.description && styles.textInputError
                ]}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="Provide detailed information about your issue..."
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
              <View style={styles.tipsHeader}>
                <MaterialIcons name="tips-and-updates" size={22} color={BRAND_COLORS.primary} />
                <Text style={styles.tipsTitle}>Tips for Better Support</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipsText}>Be clear and specific about the issue</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipsText}>Include steps to reproduce the problem</Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipsText}>Mention when the issue started</Text>
                </View>
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
                <ActivityIndicator size="small" color={BRAND_COLORS.white} />
              ) : (
                <>
                  <MaterialIcons name="send" size={20} color={BRAND_COLORS.white} />
                  <Text style={styles.submitButtonText}>Submit Ticket</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.tertiary,
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
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
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
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  textInput: {
    borderWidth: 1.5,
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
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    backgroundColor: BRAND_COLORS.background.primary,
    minHeight: 140,
  },
  textInputError: {
    borderColor: BRAND_COLORS.error,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.error,
    marginTop: SPACING.xs,
  },
  characterCount: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  categoryItem: {
    width: '48%',
    margin: '1%',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border.primary,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  categoryItemSelected: {
    borderColor: BRAND_COLORS.primary,
    backgroundColor: `${BRAND_COLORS.primary}05`,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  categoryIconContainerSelected: {
    backgroundColor: `${BRAND_COLORS.primary}15`,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.secondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: BRAND_COLORS.primary,
  },
  categoryDesc: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
    textAlign: 'center',
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
    borderWidth: 1.5,
    borderColor: BRAND_COLORS.border.primary,
    backgroundColor: BRAND_COLORS.background.primary,
    gap: SPACING.sm,
  },
  priorityText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  tipsContainer: {
    backgroundColor: `${BRAND_COLORS.primary}08`,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: `${BRAND_COLORS.primary}20`,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tipsTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.primary,
    marginLeft: SPACING.sm,
  },
  tipsList: {
    gap: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_COLORS.primary,
    marginTop: 6,
    marginRight: SPACING.sm,
  },
  tipsText: {
    flex: 1,
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
    shadowColor: BRAND_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.white,
  },
});
