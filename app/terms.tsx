import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    I18nManager,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { BRAND_COLORS, SPACING, TYPOGRAPHY } from '../constants/Theme';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaWrapper backgroundColor="#FFFFFF">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={styles.headerTitle}>شروط الاستخدام</Text>
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
            <Text style={styles.sectionTitle}>القبول</Text>
            <Text style={styles.paragraph}>
              باستخدام تطبيق فيلورينا، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، فيرجى عدم استخدام التطبيق.
            </Text>

            <Text style={styles.sectionTitle}>وصف الخدمة</Text>
            <Text style={styles.paragraph}>
              فيلورينا هو تطبيق يوفر خدمات التصميم والطباعة والحجز. نحن نقدم:
            </Text>
            <Text style={styles.paragraph}>
              خدمات التصميم والطباعة{'\n'}
              حجز المواعيد{'\n'}
              إدارة الطلبات{'\n'}
              الدعم الفني
            </Text>

            <Text style={styles.sectionTitle}>حساب المستخدم</Text>
            <Text style={styles.paragraph}>
              يجب أن تكون 18 عاماً أو أكثر لاستخدام التطبيق{'\n'}
              يجب تقديم معلومات صحيحة ودقيقة{'\n'}
              أنت مسؤول عن الحفاظ على سرية حسابك{'\n'}
              يجب إشعارنا فوراً بأي استخدام غير مصرح به
            </Text>

            <Text style={styles.sectionTitle}>الطلبات والدفع</Text>
            <Text style={styles.paragraph}>
              جميع الأسعار بالريال السعودي{'\n'}
              الدفع مطلوب عند تقديم الطلب{'\n'}
              يمكن إلغاء الطلب خلال 24 ساعة من التقديم{'\n'}
              الأسعار قابلة للتغيير دون إشعار مسبق
            </Text>

            <Text style={styles.sectionTitle}>المواعيد</Text>
            <Text style={styles.paragraph}>
              يجب الحضور في الوقت المحدد{'\n'}
              يمكن إلغاء الموعد قبل 24 ساعة{'\n'}
              التأخير أكثر من 15 دقيقة قد يؤدي إلى إلغاء الموعد
            </Text>

            <Text style={styles.sectionTitle}>الملكية الفكرية</Text>
            <Text style={styles.paragraph}>
              جميع التصاميم والمحتوى محمي بحقوق الطبع والنشر{'\n'}
              لا يجوز نسخ أو توزيع المحتوى دون إذن{'\n'}
              المستخدم يحتفظ بحقوق تصاميمه الخاصة
            </Text>

            <Text style={styles.sectionTitle}>الاستخدام المقبول</Text>
            <Text style={styles.paragraph}>
              لا يجوز لك:
            </Text>
            <Text style={styles.paragraph}>
              استخدام التطبيق لأغراض غير قانونية{'\n'}
              محاولة اختراق أو تعطيل التطبيق{'\n'}
              نشر محتوى مسيء أو غير لائق{'\n'}
              انتهاك حقوق الآخرين
            </Text>

            <Text style={styles.sectionTitle}>إلغاء الخدمة</Text>
            <Text style={styles.paragraph}>
              نحتفظ بالحق في:
            </Text>
            <Text style={styles.paragraph}>
              إلغاء أو تعليق حسابك في أي وقت{'\n'}
              رفض تقديم الخدمة{'\n'}
              تعديل أو إيقاف التطبيق
            </Text>

            <Text style={styles.sectionTitle}>الضمانات والإعفاءات</Text>
            <Text style={styles.paragraph}>
              الخدمة مقدمة &quot;كما هي&quot; دون ضمانات{'\n'}
              لا نضمن عدم انقطاع الخدمة{'\n'}
              المسؤولية محدودة بالقيمة المدفوعة
            </Text>

            <Text style={styles.sectionTitle}>التعديلات</Text>
            <Text style={styles.paragraph}>
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إشعارك بالتغييرات المهمة عبر التطبيق.
            </Text>

            <Text style={styles.sectionTitle}>القانون المطبق</Text>
            <Text style={styles.paragraph}>
              تخضع هذه الشروط لقوانين المملكة العربية السعودية. أي نزاعات تحل في محاكم المملكة.
            </Text>

            <Text style={styles.sectionTitle}>التواصل</Text>
            <Text style={styles.paragraph}>
              للاستفسارات حول هذه الشروط، يرجى التواصل معنا:
            </Text>
            <Text style={styles.paragraph}>
              البريد الإلكتروني: legal@velorena.com{'\n'}
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
