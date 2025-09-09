import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAvailableTimeSlots } from '../hooks/useAvailableTimeSlots';
import { createAppointment } from '../utils/api';

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

const DAYS_OF_WEEK = ['الأحد', 'الأثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

type AppointmentSlot = {
  id: number;
  time: string;
  duration: string;
  day: string;
  available: boolean;
};

export default function CalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
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
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const daysScrollRef = useRef<ScrollView>(null);
  const [containerWidth, setContainerWidth] = useState(300); // Default width
  
  // Check if we're in "select mode" (coming from create appointment form)
  const isSelectMode = params.mode === 'select';

  // Format selected date for API
  const selectedDateString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
  
  console.log('📅 Calendar selected date:', { selectedDate, selectedMonth, selectedYear, selectedDateString });

  // Function to calculate optimal scroll position to center a day
  const calculateScrollPosition = (dayIndex: number) => {
    const itemWidth = 60; // Width of each day item
    const visibleItems = Math.floor(containerWidth / itemWidth); // Number of items visible
    const centerOffset = Math.floor(visibleItems / 2); // Items to show on each side
    
    // Calculate the ideal position to center the selected day
    let scrollPosition = (dayIndex - centerOffset) * itemWidth;
    
    // Handle edge cases:
    // 1. If we're near the beginning, start from 0 but try to show the selected day
    if (scrollPosition < 0) {
      // For early dates, just scroll to show the selected day at the beginning
      scrollPosition = dayIndex * itemWidth;
    }
    
    // 2. If we're near the end, ensure we don't scroll past the content
    const maxScrollPosition = Math.max(0, (monthDays.length - visibleItems) * itemWidth);
    if (scrollPosition > maxScrollPosition) {
      scrollPosition = maxScrollPosition;
    }
    
    console.log('📊 Scroll calculation:', {
      dayIndex,
      itemWidth,
      visibleItems,
      centerOffset,
      calculatedPosition: (dayIndex - centerOffset) * itemWidth,
      finalPosition: scrollPosition,
      maxScrollPosition,
      monthDaysLength: monthDays.length
    });
    
    return scrollPosition;
  };
  
  // Use available time slots hook
  const { timeSlots, loading: loadingSlots, error: slotsError, slotInfo, changeDate } = useAvailableTimeSlots(selectedDateString);

  // Update time slots when date changes
  useEffect(() => {
    console.log('📅 Date changed, loading time slots for:', selectedDateString);
    changeDate(selectedDateString);
  }, [selectedDateString, changeDate]);


  // Generate only current month's days (no previous/next month days)
  const generateMonthDays = () => {
    const days = [];
    const dayNames = ['السبت', 'الجمعة', 'الخميس', 'الأربعاء', 'الثلاثاء', 'الأثنين', 'الأحد'];
    
    // Use selected month/year
    const year = selectedYear;
    const month = selectedMonth; // 0-indexed (0 = January, 7 = August)
    
    // Get first day of the month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    // Convert to our Arabic day order (0 = Saturday, 6 = Friday)
    const firstDayOfWeek = (firstDay.getDay() + 1) % 7;
    
    // Add only days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayIndex = (firstDayOfWeek + i - 1) % 7;
      const isToday = currentDate.getDate() === i && 
                     currentDate.getMonth() === month && 
                     currentDate.getFullYear() === year;
      
      // Check if this date is in the past (compare only dates, not time)
      const dayDate = new Date(year, month, i);
      const todayDate = new Date(currentDate);
      todayDate.setHours(0, 0, 0, 0); // Reset time to start of day
      dayDate.setHours(0, 0, 0, 0); // Reset time to start of day
      const isPast = dayDate < todayDate; // Allow today's date
      
      days.push({
        date: i,
        dayName: dayNames[dayIndex],
        isCurrentMonth: true,
        isToday: isToday,
        isPast: isPast
      });
    }
    
    return days.reverse(); // RTL order
  };

  const monthDays = generateMonthDays();

  // Auto-scroll to current day when component mounts
  useEffect(() => {
    const scrollToCurrentDay = () => {
      if (daysScrollRef.current && monthDays.length > 0) {
        // Find the index of today's date
        const todayIndex = monthDays.findIndex(day => 
          day.isToday && day.isCurrentMonth
        );
        
        if (todayIndex !== -1) {
          // Simple approach: center today's date in the visible area
          const itemWidth = 60;
          const visibleItems = Math.floor(containerWidth / itemWidth);
          const centerOffset = Math.floor(visibleItems / 2);
          
          // Calculate scroll position to center today's date
          let scrollPosition = (todayIndex - centerOffset) * itemWidth;
          
          // Ensure we don't scroll past the beginning
          if (scrollPosition < 0) {
            scrollPosition = 0;
          }
          
          // Ensure we don't scroll past the end
          const maxScrollPosition = Math.max(0, (monthDays.length - visibleItems) * itemWidth);
          if (scrollPosition > maxScrollPosition) {
            scrollPosition = maxScrollPosition;
          }
          
          setTimeout(() => {
            daysScrollRef.current?.scrollTo({
              x: scrollPosition,
              animated: true
            });
          }, 100);
        }
      }
    };

    scrollToCurrentDay();
  }, [monthDays, containerWidth]);

  // Auto-scroll to selected date when it changes
  useEffect(() => {
    const scrollToSelectedDate = () => {
      if (daysScrollRef.current && monthDays.length > 0) {
        // Find the index of selected date
        const selectedIndex = monthDays.findIndex(day => 
          day.date === selectedDate && day.isCurrentMonth
        );
        
        console.log('🎯 Scrolling to selected date:', {
          selectedDate,
          selectedIndex,
          monthDaysLength: monthDays.length,
          containerWidth
        });
        
        if (selectedIndex !== -1) {
          // Simple approach: center the selected day in the visible area
          const itemWidth = 60;
          const visibleItems = Math.floor(containerWidth / itemWidth);
          const centerOffset = Math.floor(visibleItems / 2);
          
          // Calculate scroll position to center the selected day
          let scrollPosition = (selectedIndex - centerOffset) * itemWidth;
          
          // Ensure we don't scroll past the beginning
          if (scrollPosition < 0) {
            scrollPosition = 0;
          }
          
          // Ensure we don't scroll past the end
          const maxScrollPosition = Math.max(0, (monthDays.length - visibleItems) * itemWidth);
          if (scrollPosition > maxScrollPosition) {
            scrollPosition = maxScrollPosition;
          }
          
          console.log('🎯 Simple scroll calculation (current month only):', {
            selectedDate,
            selectedIndex,
            itemWidth,
            visibleItems,
            centerOffset,
            scrollPosition,
            maxScrollPosition,
            monthDaysLength: monthDays.length
          });
          
          setTimeout(() => {
            console.log('🎯 Executing simple scroll to position:', scrollPosition);
            daysScrollRef.current?.scrollTo({
              x: scrollPosition,
              animated: true
            });
          }, 100);
        }
      }
    };

    scrollToSelectedDate();
  }, [selectedDate, monthDays, containerWidth]);

  // Auto-scroll to today when month changes
  useEffect(() => {
    const scrollToToday = () => {
      if (daysScrollRef.current && monthDays.length > 0) {
        // Find the index of today's date
        const todayIndex = monthDays.findIndex(day => 
          day.isToday && day.isCurrentMonth
        );
        
        if (todayIndex !== -1) {
          // Simple approach: center today's date in the visible area
          const itemWidth = 60;
          const visibleItems = Math.floor(containerWidth / itemWidth);
          const centerOffset = Math.floor(visibleItems / 2);
          
          // Calculate scroll position to center today's date
          let scrollPosition = (todayIndex - centerOffset) * itemWidth;
          
          // Ensure we don't scroll past the beginning
          if (scrollPosition < 0) {
            scrollPosition = 0;
          }
          
          // Ensure we don't scroll past the end
          const maxScrollPosition = Math.max(0, (monthDays.length - visibleItems) * itemWidth);
          if (scrollPosition > maxScrollPosition) {
            scrollPosition = maxScrollPosition;
          }
          
          setTimeout(() => {
            daysScrollRef.current?.scrollTo({
              x: scrollPosition,
              animated: true
            });
          }, 200);
        }
      }
    };

    scrollToToday();
  }, [selectedMonth, selectedYear, monthDays, containerWidth]);

  // Generate years (current year ± 5 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  const availableYears = generateYears();

  // Transform time slots into appointment slots format for compatibility
  const appointmentSlots = timeSlots.length > 0 ? timeSlots.map((time, index) => ({
    id: `slot-${index}`,
    time: time,
    duration: '30 دقيقة',
    day: selectedDateString,
    available: true,
    appointment: null
  })) : [
    // Fallback mock slots for testing
    { id: 'mock-1', time: '08:00', duration: '30 دقيقة', day: selectedDateString, available: true, appointment: null },
    { id: 'mock-2', time: '08:30', duration: '30 دقيقة', day: selectedDateString, available: true, appointment: null },
    { id: 'mock-3', time: '09:00', duration: '30 دقيقة', day: selectedDateString, available: true, appointment: null },
    { id: 'mock-4', time: '09:30', duration: '30 دقيقة', day: selectedDateString, available: true, appointment: null },
    { id: 'mock-5', time: '10:00', duration: '30 دقيقة', day: selectedDateString, available: true, appointment: null },
  ];


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

  const handleDateTimeSelection = (time: string) => {
    if (isSelectMode) {
      setSelectedTime(time);
      // Format the selected date
      const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      
      // Navigate back to create appointment form with selected date and time as params
      router.push({
        pathname: '/create-appointment' as any,
        params: {
          selectedDate: formattedDate,
          selectedTime: time
        }
      });
    }
  };

  const handleBookAppointment = async (appointment: any) => {
    Alert.alert(
      'تأكيد الحجز',
      `هل تريد حجز موعد ${appointment.appointment_time}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تأكيد', 
          onPress: async () => {
            try {
              // If it's an existing appointment, just confirm it
              if (appointment.id) {
                Alert.alert('تم الحجز', 'تم حجز موعدك بنجاح!');
                router.push('/appointments');
                return;
              }

              // For new appointments, create them via API
              const selectedDateObj = new Date(selectedYear, selectedMonth, selectedDate);
              const dateStr = selectedDateObj.toISOString().split('T')[0];
              
              await createAppointment({
                appointment_date: dateStr,
                appointment_time: appointment.appointment_time,
                service_type: appointment.service_type || 'استشارة تصميم',
                description: appointment.description,
                duration: 60, // Default 60 minutes
                location: appointment.location || 'عن بُعد',
                notes: appointment.notes,
                order_id: appointment.order_id,
                order_notes: appointment.order_notes
              });

              Alert.alert('تم الحجز', 'تم حجز موعدك بنجاح!');
              router.push('/appointments');
            } catch (error) {
              console.error('Failed to book appointment:', error);
              Alert.alert('خطأ', 'فشل في حجز الموعد. حاول مرة أخرى.');
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity onPress={handleBackNavigation} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>موعد مع المصمم</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month and Date Selection */}
        <View style={styles.dateSection}>
          <View style={styles.dateRow}>
            {/* Days of Month - Scrollable */}
            <ScrollView 
              ref={daysScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContainer}
              style={styles.daysScrollView}
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                setContainerWidth(width);
              }}
            >
              {monthDays.map((dayData, index) => (
                <View key={`${dayData.date}-${index}`} style={styles.dayOfWeekColumn}>
                  <Text style={[
                    styles.dayOfWeekText,
                    !dayData.isCurrentMonth && styles.dayOfWeekTextInactive
                  ]}>
                    {dayData.dayName}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      selectedDate === dayData.date && dayData.isCurrentMonth && !dayData.isPast && styles.selectedDateButton,
                      dayData.isToday && dayData.isCurrentMonth && styles.todayButton,
                      dayData.isPast && dayData.isCurrentMonth && styles.pastDateButton
                    ]}
                    onPress={() => dayData.isCurrentMonth && !dayData.isPast && setSelectedDate(dayData.date)}
                    activeOpacity={dayData.isCurrentMonth && !dayData.isPast ? 0.7 : 1}
                    disabled={!dayData.isCurrentMonth || dayData.isPast}
                  >
                    <Text style={[
                      styles.dateText,
                      selectedDate === dayData.date && dayData.isCurrentMonth && !dayData.isPast && styles.selectedDateText,
                      !dayData.isCurrentMonth && styles.dateTextInactive,
                      dayData.isToday && dayData.isCurrentMonth && styles.todayText,
                      dayData.isPast && dayData.isCurrentMonth && styles.pastDateText
                    ]}>
                      {dayData.date}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Month Selector */}
            <TouchableOpacity 
              style={styles.monthSelector}
              onPress={() => setShowMonthPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.monthText}>{MONTHS[selectedMonth]} {selectedYear}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.primary} />
            </TouchableOpacity>
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
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.durationText}>{slot.duration}</Text>
                    <View style={styles.timeContainer}>
                      <MaterialIcons name="access-time" size={16} color={COLORS.primary} />
                      <Text style={styles.timeText}>{slot.time}</Text>
                    </View>
                    <Text style={styles.serviceTypeText}>موعد متاح</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => isSelectMode ? handleDateTimeSelection(slot.time) : handleBookAppointment(slot)}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="event" size={16} color={COLORS.white} />
                    <Text style={styles.bookButtonText}>
                      {isSelectMode ? 'اختيار هذا الوقت' : 'حجز موعد'}
                    </Text>
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

      {/* Month/Year Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>اختر الشهر والسنة</Text>
              <TouchableOpacity 
                onPress={() => setShowMonthPicker(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContent}>
              {/* Month Picker */}
              <View style={styles.pickerSection}>
                <Text style={styles.pickerSectionTitle}>الشهر</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((month, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedMonth === index && styles.pickerItemTextSelected
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={styles.pickerSection}>
                <Text style={styles.pickerSectionTitle}>السنة</Text>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {availableYears.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        selectedYear === year && styles.pickerItemTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.pickerFooter}>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => setShowMonthPicker(false)}
              >
                <Text style={styles.confirmButtonText}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginRight: 40, // Offset for back button
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_800ExtraBold',
  },

  // Content
  content: {
    padding: 20,
  },

  // Date Section
  dateSection: {
    marginBottom: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    gap: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  daysScrollView: {
    flex: 1,
  },
  daysScrollContainer: {
    paddingHorizontal: 4,
    gap: 8,
  },
  dayOfWeekColumn: {
    alignItems: 'center',
    minWidth: 36,
    marginRight: 4,
  },
  dayOfWeekText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 6,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  dayOfWeekTextInactive: {
    color: COLORS.gray[300],
  },
  dateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  selectedDateButton: {
    backgroundColor: COLORS.secondary,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  selectedDateText: {
    color: COLORS.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  dateTextInactive: {
    color: COLORS.gray[300],
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  todayButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  todayText: {
    color: COLORS.primary,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  pastDateButton: {
    backgroundColor: COLORS.gray[200],
    borderColor: COLORS.gray[300],
    opacity: 0.5,
  },
  pastDateText: {
    color: COLORS.gray[400],
    fontFamily: 'NotoSansArabic_400Regular',
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
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  appointmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 6,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  serviceTypeText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  locationText: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[300],
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_700Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContent: {
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  pickerSection: {
    flex: 1,
  },
  pickerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: COLORS.gray[50],
  },
  pickerItemSelected: {
    backgroundColor: COLORS.secondary,
  },
  pickerItemText: {
    fontSize: 14,
    color: COLORS.gray[700],
    textAlign: 'center',
    writingDirection: 'rtl',
    fontFamily: 'NotoSansArabic_400Regular',
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'NotoSansArabic_600SemiBold',
  },
  pickerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[300],
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
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
