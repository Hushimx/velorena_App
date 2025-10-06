import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={styles.headerTitle}>سياسة الخصوصية</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-forward" size={24} color={BRAND_COLORS.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>مقدمة</Text>
            <Text style={styles.paragraph}>
              نحن في فيلورينا نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية. هذه السياسة توضح كيفية جمع واستخدام وحماية معلوماتك عند استخدام تطبيقنا.
            </Text>

            <Text style={styles.sectionTitle}>المعلومات التي نجمعها</Text>
            <Text style={styles.paragraph}>
              المعلومات الشخصية: الاسم، البريد الإلكتروني، رقم الهاتف، العنوان{'\n'}
              معلومات الحساب: نوع الحساب (فردي أو شركة)، تاريخ التسجيل{'\n'}
              معلومات الاستخدام: الطلبات، المواعيد، التصاميم
            </Text>

            <Text style={styles.sectionTitle}>كيف نستخدم معلوماتك</Text>
            <Text style={styles.paragraph}>
              تقديم الخدمات المطلوبة{'\n'}
              التواصل معك حول طلباتك ومواعيدك{'\n'}
              تحسين خدماتنا وتطويرها{'\n'}
              الامتثال للقوانين واللوائح
            </Text>

            <Text style={styles.sectionTitle}>حماية معلوماتك</Text>
            <Text style={styles.paragraph}>
              نستخدم تقنيات الأمان المتقدمة لحماية معلوماتك من الوصول غير المصرح به أو التغيير أو الكشف أو التدمير.
            </Text>

            <Text style={styles.sectionTitle}>مشاركة المعلومات</Text>
            <Text style={styles.paragraph}>
              لا نشارك معلوماتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:
            </Text>
            <Text style={styles.paragraph}>
              بموافقتك الصريحة{'\n'}
              لتقديم الخدمات المطلوبة{'\n'}
              للامتثال للقوانين واللوائح
            </Text>

            <Text style={styles.sectionTitle}>حقوقك</Text>
            <Text style={styles.paragraph}>
              لديك الحق في:
            </Text>
            <Text style={styles.paragraph}>
              الوصول إلى معلوماتك الشخصية{'\n'}
              تصحيح أو تحديث معلوماتك{'\n'}
              حذف حسابك ومعلوماتك{'\n'}
              سحب موافقتك في أي وقت
            </Text>

            <Text style={styles.sectionTitle}>التحديثات</Text>
            <Text style={styles.paragraph}>
              قد نقوم بتحديث هذه السياسة من وقت لآخر. سنقوم بإشعارك بأي تغييرات مهمة عبر التطبيق أو البريد الإلكتروني.
            </Text>

            <Text style={styles.sectionTitle}>التواصل معنا</Text>
            <Text style={styles.paragraph}>
              إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا عبر:
            </Text>
            <Text style={styles.paragraph}>
              البريد الإلكتروني: privacy@velorena.com{'\n'}
              الهاتف: +966 XX XXX XXXX
            </Text>

            <Text style={styles.lastUpdated}>
              آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background.primary,
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
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: BRAND_COLORS.text.primary,
    marginTop: SPACING['2xl'],
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  paragraph: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: BRAND_COLORS.text.primary,
    lineHeight: 26,
    marginBottom: SPACING.md,
    textAlign: 'right',
  },
  lastUpdated: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: BRAND_COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING['3xl'],
    marginBottom: SPACING.lg,
  },
});
