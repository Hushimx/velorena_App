import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../../../constants/Theme';
import { useSupportStore } from '../../../store/useSupportStore';
import { SupportTicketCategory, SupportTicketPriority, SupportTicketReply, SupportTicketStatus } from '../../../utils/api';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentTicket,
    currentTicketLoading,
    currentTicketError,
    fetchTicketById,
    addReply,
    clearCurrentTicket
  } = useSupportStore();

  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicketById(id);
    }

    return () => {
      clearCurrentTicket();
    };
  }, [id]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !id) return;

    setSendingReply(true);
    try {
      await addReply(id, { message: replyText.trim() });
      setReplyText('');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الرد. يرجى المحاولة مرة أخرى.');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusColor = (status: SupportTicketStatus) => {
    switch (status) {
      case 'open': return BRAND_COLORS.info;
      case 'in_progress': return BRAND_COLORS.warning;
      case 'pending': return BRAND_COLORS.gray[500];
      case 'resolved': return BRAND_COLORS.success;
      case 'closed': return BRAND_COLORS.gray[600];
      default: return BRAND_COLORS.gray[500];
    }
  };

  const getPriorityColor = (priority: SupportTicketPriority) => {
    switch (priority) {
      case 'urgent': return BRAND_COLORS.error;
      case 'high': return '#ff6b35';
      case 'medium': return BRAND_COLORS.warning;
      case 'low': return BRAND_COLORS.success;
      default: return BRAND_COLORS.gray[500];
    }
  };

  const getStatusText = (status: SupportTicketStatus) => {
    switch (status) {
      case 'open': return 'مفتوح';
      case 'in_progress': return 'قيد المعالجة';
      case 'pending': return 'في الانتظار';
      case 'resolved': return 'تم الحل';
      case 'closed': return 'مغلق';
      default: return status;
    }
  };

  const getPriorityText = (priority: SupportTicketPriority) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'عالي';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return priority;
    }
  };

  const getCategoryText = (category: SupportTicketCategory) => {
    switch (category) {
      case 'technical': return 'تقني';
      case 'billing': return 'الفوترة';
      case 'general': return 'عام';
      case 'feature_request': return 'طلب ميزة';
      case 'bug_report': return 'تقرير خطأ';
      default: return category;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderReply = ({ item }: { item: SupportTicketReply }) => {
    const isUser = item.author_type === 'user';
    
    return (
      <View style={[
        styles.replyContainer,
        isUser ? styles.userReply : styles.adminReply
      ]}>
        <View style={[
          styles.replyBubble,
          isUser ? styles.userBubble : styles.adminBubble
        ]}>
          <View style={styles.replyHeader}>
            <Text style={[
              styles.replyAuthor,
              isUser ? styles.userAuthor : styles.adminAuthor
            ]}>
              {item.author_name}
            </Text>
            <Text style={styles.replyDate}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          <Text style={[
            styles.replyMessage,
            isUser ? styles.userMessage : styles.adminMessage
          ]}>
            {item.message}
          </Text>
        </View>
      </View>
    );
  };

  if (currentTicketLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
          <Text style={styles.loadingText}>جاري تحميل التذكرة...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentTicketError || !currentTicket) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={BRAND_COLORS.error} />
          <Text style={styles.errorText}>
            {currentTicketError || 'لم يتم العثور على التذكرة'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => id && fetchTicketById(id)}
          >
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canReply = currentTicket.status !== 'closed';

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
                <MaterialIcons name="arrow-forward" size={24} color={BRAND_COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>تفاصيل التذكرة</Text>
            </View>
          </View>

          {/* Ticket Info */}
          <View style={styles.ticketInfo}>
            <View style={styles.ticketHeader}>
              <View style={styles.ticketMeta}>
                <Text style={styles.ticketNumber}>{currentTicket.ticket_number}</Text>
                <View style={styles.ticketTags}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentTicket.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(currentTicket.status)}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(currentTicket.priority) }]}>
                    <Text style={styles.priorityText}>{getPriorityText(currentTicket.priority)}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{getCategoryText(currentTicket.category)}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.ticketSubject}>{currentTicket.subject}</Text>
            <Text style={styles.ticketDescription}>{currentTicket.description}</Text>

            <View style={styles.ticketFooter}>
              <Text style={styles.ticketDate}>
                تم الإنشاء: {formatDate(currentTicket.created_at)}
              </Text>
              {currentTicket.assigned_admin && (
                <Text style={styles.assignedAdmin}>
                  مُعيّن لـ: {currentTicket.assigned_admin.name}
                </Text>
              )}
            </View>
          </View>

          {/* Replies */}
          <View style={styles.repliesSection}>
            <Text style={styles.repliesTitle}>
              المحادثة ({currentTicket.replies?.length || 0})
            </Text>
            
            <FlatList
              data={currentTicket.replies || []}
              renderItem={renderReply}
              keyExtractor={(item) => item.id.toString()}
              style={styles.repliesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyReplies}>
                  <MaterialIcons name="chat-bubble-outline" size={48} color={BRAND_COLORS.gray[400]} />
                  <Text style={styles.emptyRepliesText}>لا توجد ردود بعد</Text>
                </View>
              }
            />
          </View>

          {/* Reply Input */}
          {canReply && (
            <View style={styles.replyInputContainer}>
              <View style={styles.replyInput}>
                <TextInput
                  style={styles.replyTextInput}
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="اكتب ردك هنا..."
                  placeholderTextColor={BRAND_COLORS.text.tertiary}
                  multiline
                  maxLength={5000}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!replyText.trim() || sendingReply) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                >
                  {sendingReply ? (
                    <ActivityIndicator size="small" color={BRAND_COLORS.text.inverse} />
                  ) : (
                    <MaterialIcons name="send" size={20} color={BRAND_COLORS.text.inverse} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {!canReply && (
            <View style={styles.closedNotice}>
              <MaterialIcons name="lock" size={24} color={BRAND_COLORS.gray[500]} />
              <Text style={styles.closedNoticeText}>
                هذه التذكرة مغلقة ولا يمكن إضافة ردود جديدة
              </Text>
            </View>
          )}
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
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  retryButton: {
    backgroundColor: BRAND_COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  retryButtonText: {
    color: BRAND_COLORS.text.inverse,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  ticketInfo: {
    backgroundColor: BRAND_COLORS.background.primary,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
  },
  ticketHeader: {
    marginBottom: SPACING.md,
  },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  ticketNumber: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.primary,
  },
  ticketTags: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.inverse,
  },
  priorityBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.inverse,
  },
  categoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: BRAND_COLORS.gray[200],
  },
  categoryText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  ticketSubject: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  ticketDescription: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  ticketFooter: {
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border.primary,
    paddingTop: SPACING.md,
  },
  ticketDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
    marginBottom: SPACING.xs,
  },
  assignedAdmin: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
  },
  repliesSection: {
    flex: 1,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  repliesTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    color: BRAND_COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  repliesList: {
    flex: 1,
  },
  replyContainer: {
    marginBottom: SPACING.md,
  },
  userReply: {
    alignItems: 'flex-end',
  },
  adminReply: {
    alignItems: 'flex-start',
  },
  replyBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: SPACING.md,
  },
  userBubble: {
    backgroundColor: BRAND_COLORS.primary,
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: BRAND_COLORS.gray[100],
    borderBottomLeftRadius: 4,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  replyAuthor: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  userAuthor: {
    color: BRAND_COLORS.text.inverse,
  },
  adminAuthor: {
    color: BRAND_COLORS.primary,
  },
  replyDate: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.tertiary,
  },
  replyMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 20,
  },
  userMessage: {
    color: BRAND_COLORS.text.inverse,
  },
  adminMessage: {
    color: BRAND_COLORS.text.primary,
  },
  emptyReplies: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
  },
  emptyRepliesText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  replyInputContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: BRAND_COLORS.border.primary,
    backgroundColor: BRAND_COLORS.background.primary,
  },
  replyInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: BRAND_COLORS.gray[50],
    borderRadius: 24,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
  },
  replyTextInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    maxHeight: 100,
    paddingVertical: SPACING.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  sendButtonDisabled: {
    backgroundColor: BRAND_COLORS.gray[300],
  },
  closedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: BRAND_COLORS.gray[50],
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border.primary,
  },
  closedNoticeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
    marginLeft: SPACING.sm,
    textAlign: 'center',
  },
});


