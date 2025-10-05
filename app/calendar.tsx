import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAvailableTimeSlots } from '../hooks/useAvailableTimeSlots';
import SafeAreaWrapper from '../components/SafeAreaWrapper';

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
  console.log('🕐 Current system date:', currentDate.toISOString());
  console.log('🕐 Current date components:', { 
    date: currentDate.getDate(), 
    month: currentDate.getMonth(), 
    year: currentDate.getFullYear() 
  });
  
  const [selectedDate, setSelectedDate] = useState(currentDate.getDate());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth()); // Current month (0-indexed)
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // Check if we're in "select mode" (coming from create appointment form)
  const isSelectMode = params.mode === 'select';

  // Format selected date for API
  const selectedDateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
  
  console.log('📅 Calendar selected date:', { selectedDate, selectedMonth, selectedYear, selectedDateString });

  // Use available time slots hook
  const { timeSlots, loading: loadingSlots, error: slotsError, slotInfo, changeDate } = useAvailableTimeSlots(selectedDateString);

  // Update time slots when date changes
  useEffect(() => {
    console.log('📅 Date changed, loading time slots for:', selectedDateString);
    changeDate(selectedDateString);
  }, [selectedDateString, changeDate]);

  // Generate next 7 days starting from today for calendar display
  const generateNextDays = () => {
    const days = [];
    const dayNames = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Generate next 7 days to show a full week
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() + i);
      
      const isToday = i === 0;
      const dayIndex = dayDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      days.push({
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
    }
    
    return days;
  };

  const nextDays = generateNextDays();



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
      console.log('Navigation error, going to home:', error);
      router.push('/(tabs)');
    }
  };

  const handleDateTimeSelection = async (time: string) => {
    console.log('🔍 handleDateTimeSelection called:', {
      time,
      isSelectMode,
      hasCartItems,
      orderId,
      selectedDate,
      selectedMonth,
      selectedYear
    });

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
    
    console.log('✅ Navigating to create-appointment with params:', appointmentParams);
    
    // Navigate directly to create appointment
    router.push({
      pathname: '/create-appointment' as any,
      params: appointmentParams
    });
  };

  return (
    <SafeAreaWrapper backgroundColor={COLORS.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
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
        {/* Calendar Week View */}
        <View style={styles.dateSection}>
          <View style={styles.calendarContainer}>
            {/* Day Names Row */}
            <View style={styles.dayNamesRow}>
              {nextDays.map((dayData, index) => (
                <View key={`day-name-${index}`} style={styles.dayNameContainer}>
                  <Text style={styles.dayNameText}>{dayData.dayName}</Text>
                </View>
              ))}
            </View>
            
            {/* Date Numbers Row */}
            <View style={styles.dateNumbersRow}>
              {nextDays.map((dayData, index) => (
                <TouchableOpacity
                  key={`${dayData.date}-${dayData.month}-${index}`}
                  style={[
                    styles.dateNumberContainer,
                    selectedDate === dayData.date && dayData.month === selectedMonth && styles.selectedDateContainer
                  ]}
                  onPress={() => {
                    setSelectedDate(dayData.date);
                    setSelectedMonth(dayData.month);
                    setSelectedYear(dayData.year);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dateNumber,
                    selectedDate === dayData.date && dayData.month === selectedMonth && styles.selectedDateNumber
                  ]}>
                    {dayData.date}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
  },
  
  // Header
  header: {
    flexDirection: 'row',
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
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: 2,
    writingDirection: 'rtl',
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  dayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayNameContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[600],
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  dateNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateNumberContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  selectedDateContainer: {
    backgroundColor: '#ffde9f', // Light orange background
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
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  appointmentCard: {
    backgroundColor: '#f5f5dc', // Light beige background like in the image
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
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
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
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 24,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
});
