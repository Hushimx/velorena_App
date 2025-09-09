import { useCallback, useEffect, useState } from 'react';
import { AvailableTimeSlotsResponse, getAvailableTimeSlots } from '../utils/api';

export function useAvailableTimeSlots(initialDate?: string) {
  const [date, setDate] = useState<string | undefined>(initialDate);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotInfo, setSlotInfo] = useState<{
    date: string;
    day_of_week: string;
    total_slots: number;
    slot_duration: number;
  } | null>(null);

  const loadTimeSlots = useCallback(async (targetDate?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: AvailableTimeSlotsResponse = await getAvailableTimeSlots(targetDate);
      setTimeSlots(response.data.available_slots);
      setSlotInfo({
        date: response.data.date,
        day_of_week: response.data.day_of_week,
        total_slots: response.data.total_slots,
        slot_duration: response.data.slot_duration,
      });
    } catch (err) {
      console.error('Failed to load available time slots:', err);
      setError('فشل في تحميل الأوقات المتاحة');
      setTimeSlots([]);
      setSlotInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTimeSlots = useCallback(() => {
    loadTimeSlots(date);
  }, [loadTimeSlots, date]);

  const changeDate = useCallback((newDate: string) => {
    setDate(newDate);
    loadTimeSlots(newDate);
  }, [loadTimeSlots]);

  useEffect(() => {
    loadTimeSlots(date);
  }, [loadTimeSlots, date]);

  return {
    date,
    timeSlots,
    loading,
    error,
    slotInfo,
    changeDate,
    refreshTimeSlots,
  };
}
