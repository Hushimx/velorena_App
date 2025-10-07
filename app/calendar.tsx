import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { useAvailableTimeSlots } from '../hooks/useAvailableTimeSlots';

const COLORS = {
  primary: '#2a1e1e',      // Dark brown
  secondary: '#ffde9f',    // Yellow
  white: '#ffffff',
  light: '#f8fafc',
  gray: {
    50: '#f8fafc',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
  },
};

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function CalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get parameters from navigation
  const orderId = params.orderId as string;
  const hasCartItems = params.hasCartItems === 'true';
  const cartItemCount = params.cartItemCount as string;
  
  const currentDate = new Date();
  
  const [selectedDate, setSelectedDate] = useState(currentDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // Current month (0-indexed)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Check if we're in "select mode" (coming from create appointment form)
  const isSelectMode = params.mode === 'select';

  // Format selected date for API
  const selectedDateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
  

  // Use available time slots hook
  const { timeSlots, loading: loadingSlots, error: slotsError, slotInfo, changeDate } = useAvailableTimeSlots(selectedDateString);

  // Update time slots when date changes
  useEffect(() => {
    changeDate(selectedDateString);
  }, [selectedDateString, changeDate]);

  // Generate more days for horizontal scrolling with month transitions
  const generateNextDays = () => {
    const items = [];
    const dayNames = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    let lastMonth = today.getMonth();
    let currentMonthAdded = false;
    
    // Add current month at the beginning
    items.push({
      type: 'month',
      monthName: MONTHS[today.getMonth()],
      month: today.getMonth(),
      year: today.getFullYear(),
      fullDate: today
    });
    
    // Generate next 14 days for horizontal scrolling
    for (let i = 0; i < 14; i++) {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + i);
      
      const currentMonth = dayDate.getMonth();
      const isToday = i === 0;
      const dayIndex = dayDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Check if we've moved to a new month and add month label
      if (currentMonth !== lastMonth && i > 0) {
        items.push({
          type: 'month',
          monthName: MONTHS[currentMonth],
          month: currentMonth,
          year: dayDate.getFullYear(),
          fullDate: dayDate
        });
      }
      
      // Add the day item
      items.push({
        type: 'day',
        date: dayDate.getDate(),
        month: dayDate.getMonth(),
        year: dayDate.getFullYear(),
        fullDate: dayDate,
        dayName: dayNames[dayIndex],
        isCurrentMonth: true,
        isToday: isToday,
        isPast: false,
        monthName: MONTHS[dayDate.getMonth()]
      });
      
      lastMonth = currentMonth;
    }
    
    return items;
  };

  const nextDays = generateNextDays().reverse(); // Reverse to make it RTL



  // Transform time slots into appointment slots format for compatibility
  // Only show real available slots from API - no fallback mock slots
  const appointmentSlots = timeSlots.map((time, index) => ({
    id: `slot-${index}`,
    time: time,
    duration: '30 دقيقة',
    day: selectedDateString,
    available: true,
    appointment: null
  }));

  const handleBackNavigation = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/(tabs)');
      }
    } catch (error) {
      router.push('/(tabs)');
    }
  };

  const handleDateTimeSelection = async (time: string) => {

    // Format the selected date
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
    
    // Navigate to create appointment form with selected date, time, and order ID as params
    const appointmentParams: any = {
      selectedDate: formattedDate,
      selectedTime: time
    };
    
    // Include order ID if available
    if (orderId) {
      appointmentParams.orderId = orderId;
    }
    
    
    // Navigate directly to create appointment
    router.push({
      pathname: '/create-appointment' as any,
      params: appointmentParams
    });
  };

  return (
    <SafeAreaWrapper backgroundColor={COLORS.white} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
          <MaterialIcons name="arrow-forward" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>موعد مع المصمم</Text>
          {orderId && (
            <Text style={styles.headerSubtitle}>لطلب #{orderId}</Text>
          )}
          {hasCartItems && (
            <Text style={styles.headerSubtitle}>من السلة - {cartItemCount} منتج</Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Date Slider */}
        <View style={styles.dateSection}>
          <View style={styles.calendarContainer}>
            {/* Horizontal Scrollable Date Slider */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateSliderContainer}
              style={styles.dateSlider}
              directionalLockEnabled={true}
            >
              {nextDays.map((item, index) => (
                item.type === 'month' ? (
                  // Month Label
                  <View key={`month-${item.month}-${index}`} style={styles.monthItem}>
                    <Text style={styles.monthLabelText}>{item.monthName}</Text>
                  </View>
                ) : (
                  // Date Item
                  <View key={`${item.date}-${item.month}-${index}`} style={styles.dateItem}>
                    {/* Day Name */}
                    <Text style={styles.dayNameText}>{item.dayName}</Text>
                    
                    {/* Date Number */}
                    <TouchableOpacity
                      style={[
                        styles.dateNumberContainer,
                        selectedDate === item.date && item.month === selectedMonth && styles.selectedDateContainer
                      ]}
                      onPress={() => {
                        setSelectedDate(item.date);
                        setSelectedMonth(item.month);
                        setSelectedYear(item.year);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dateNumber,
                        selectedDate === item.date && item.month === selectedMonth && styles.selectedDateNumber
                      ]}>
                        {item.date}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Available Appointments */}
        <View style={styles.appointmentsSection}>
          <Text style={styles.sectionTitle}>مواعيد متاحة</Text>
          
          {loadingSlots ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>جاري تحميل الأوقات المتاحة...</Text>
            </View>
          ) : slotsError ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>خطأ في تحميل الأوقات</Text>
              <Text style={styles.emptySubtitle}>{slotsError}</Text>
            </View>
          ) : appointmentSlots.length > 0 ? (
            <>
              {slotInfo && (
                <View style={styles.slotInfoContainer}>
                  <Text style={styles.slotInfoText}>
                    {slotInfo.day_of_week} - {slotInfo.total_slots} مواعيد متاحة
                  </Text>
                </View>
              )}
              {appointmentSlots.map((slot) => (
                <View key={slot.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentHeader}>
                    <View style={styles.timeInfo}>
                      <MaterialIcons name="access-time" size={16} color={COLORS.primary} />
                      <Text style={styles.timeText}>{slot.time}</Text>
                    </View>
                    <Text style={styles.durationText}>{slot.duration}</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleDateTimeSelection(slot.time)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="event" size={16} color={COLORS.white} />
                    <Text style={styles.bookButtonText}>حجز موعد</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>لا توجد مواعيد متاحة</Text>
              <Text style={styles.emptySubtitle}>اختر تاريخ آخر أو تواصل معنا لحجز موعد</Text>
            </View>
          )}
        </View>
      </ScrollView>

    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    writingDirection: 'rtl',
  },
  
  // Header
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[300],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'NotoSansArabic_500Medium',
  },

  // Content
  content: {
    padding: 20,
  },

  // Date Section
  dateSection: {
    marginBottom: 24,
  },
  calendarContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
  },
  dateSlider: {
    marginHorizontal: -20, // Extend to full width
  },
  dateSliderContainer: {
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'center',
    flexDirection: 'row', // Normal direction but items will be in reverse order
  },
  monthItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  monthLabelText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  dateItem: {
    alignItems: 'center',
    minWidth: 50,
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'NotoSansArabic_400Regular',
  },
  dateNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
  },
  selectedDateContainer: {
    backgroundColor: '#ffde9f', // Light orange/beige background like in image
    borderRadius: 20,
    width: 40,
    height: 40,
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    textAlign: 'center',
    writingDirection: 'ltr',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  selectedDateNumber: {
    color: COLORS.primary,
    fontWeight: '700',
    fontFamily: 'NotoSansArabic_700Bold',
  },

  // Appointments Section
  appointmentsSection: {
    marginTop: 8,
  },
  slotInfoContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  slotInfoText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'right',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  appointmentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'NotoSansArabic_700Bold',
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.gray[600],
    fontSize: 16,
    fontFamily: 'NotoSansArabic_400Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.gray[700],
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'NotoSansArabic_400Regular',
  },
});
