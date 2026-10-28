import { supabase } from './supabase';
import type { MealAttendance, ResidentMealRecord, DailyMealSummary, MealType } from '../types/meals';

export function isMealTableMissing(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('relation "public.meal_attendance" does not exist') ||
    msg.includes('meal_attendance')
  );
}

export function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Standard scheduled time window and cutoff details for each meal service.
 */
export interface MealTimingConfig {
  type: MealType;
  label: string;
  start: string;            // '07:30 AM'
  end: string;              // '09:00 AM'
  formattedWindow: string;  // '07:30 AM - 09:00 AM'
  cutoffHour: number;       // 9 (09:00 AM)
  cutoffMinute: number;     // 0
  cutoffDisplay: string;    // '09:00 AM'
}

export const MEAL_TIMINGS: Record<MealType, MealTimingConfig> = {
  breakfast: {
    type: 'breakfast',
    label: 'Breakfast',
    start: '07:30 AM',
    end: '09:00 AM',
    formattedWindow: '07:30 AM - 09:00 AM',
    cutoffHour: 9,
    cutoffMinute: 0,
    cutoffDisplay: '09:00 AM',
  },
  lunch: {
    type: 'lunch',
    label: 'Lunch',
    start: '12:30 PM',
    end: '02:00 PM',
    formattedWindow: '12:30 PM - 02:00 PM',
    cutoffHour: 14,
    cutoffMinute: 0,
    cutoffDisplay: '02:00 PM',
  },
  dinner: {
    type: 'dinner',
    label: 'Dinner',
    start: '07:30 PM',
    end: '09:00 PM',
    formattedWindow: '07:30 PM - 09:00 PM',
    cutoffHour: 21,
    cutoffMinute: 0,
    cutoffDisplay: '09:00 PM',
  },
};

/**
 * Checks whether the meal cutoff time has passed for a given date.
 * - Dates strictly before today: always true (past session).
 * - Dates strictly after today: always false (future session).
 * - Date is today: true if current local time >= meal cutoff time.
 */
export function isMealCutoffPassed(meal: MealType, dateStr: string): boolean {
  const today = getTodayStr();
  if (dateStr < today) return true;
  if (dateStr > today) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const config = MEAL_TIMINGS[meal];
  const cutoffMinutes = config.cutoffHour * 60 + config.cutoffMinute;
  return currentMinutes >= cutoffMinutes;
}

/**
 * Returns current meal type based on local time of day:
 * - Breakfast: 00:00 - 11:00 (service 07:30 - 09:00)
 * - Lunch: 11:00 - 16:00 (service 12:30 - 14:00)
 * - Dinner: 16:00 - 24:00 (service 19:30 - 21:00)
 */
export function getCurrentMealType(): MealType {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes < 11 * 60) {
    return 'breakfast';
  } else if (currentMinutes < 16 * 60) {
    return 'lunch';
  } else {
    return 'dinner';
  }
}

/**
 * Standard scheduled time window for each meal service.
 */
export function getMealTimeWindow(meal: MealType): string {
  return MEAL_TIMINGS[meal]?.formattedWindow || '07:30 - 09:00';
}


/**
 * Fetches meal attendance preference for a specific resident and date.
 */
export async function getResidentMealPreference(
  residentId: string,
  date: string
): Promise<{ data: MealAttendance | null; error: string | null; tableMissing: boolean }> {
  try {
    const { data, error } = await supabase
      .from('meal_attendance')
      .select('*')
      .eq('resident_id', residentId)
      .eq('date', date)
      .maybeSingle();

    if (error) {
      if (isMealTableMissing(error)) {
        return { data: null, error: error.message, tableMissing: true };
      }
      return { data: null, error: error.message, tableMissing: false };
    }

    return { data, error: null, tableMissing: false };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch meal preference', tableMissing: false };
  }
}

/**
 * Saves or updates a resident's meal choices (Breakfast, Lunch, Dinner) for a given date.
 */
export async function saveResidentMealPreference(
  residentId: string,
  date: string,
  preferences: { breakfast: boolean; lunch: boolean; dinner: boolean }
): Promise<{ success: boolean; data?: MealAttendance; error: string | null; tableMissing: boolean }> {
  try {
    const { data, error } = await supabase
      .from('meal_attendance')
      .upsert(
        {
          resident_id: residentId,
          date,
          breakfast: preferences.breakfast,
          lunch: preferences.lunch,
          dinner: preferences.dinner,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'resident_id,date' }
      )
      .select()
      .single();

    if (error) {
      if (isMealTableMissing(error)) {
        return { success: false, error: error.message, tableMissing: true };
      }
      return { success: false, error: error.message, tableMissing: false };
    }

    return { success: true, data, error: null, tableMissing: false };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save meal preferences', tableMissing: false };
  }
}

/**
 * Fetches all registered residents alongside their meal opt-in & served status for a given date.
 */
export async function getAllResidentsMealAttendance(date: string): Promise<{
  records: ResidentMealRecord[];
  summary: DailyMealSummary;
  error: string | null;
  tableMissing: boolean;
}> {
  try {
    // 1. Fetch all residents
    let residents: any[] | null = null;
    let residentsError: any = null;

    const primaryRes = await supabase
      .from('residents')
      .select('id, admission_no, name, room_no, bed_no, mobile_no, email, meals_per_day')
      .order('admission_no', { ascending: true })
      .limit(5000);

    if (primaryRes.error && (primaryRes.error.message?.includes('meals_per_day') || primaryRes.error.code === '42703')) {
      const fallback = await supabase
        .from('residents')
        .select('id, admission_no, name, room_no, bed_no, mobile_no, email')
        .order('admission_no', { ascending: true })
        .limit(5000);
      residents = fallback.data;
      residentsError = fallback.error;
    } else {
      residents = primaryRes.data;
      residentsError = primaryRes.error;
    }

    if (residentsError) {
      return {
        records: [],
        summary: {
          date,
          totalResidents: 0,
          breakfastNeeded: 0,
          breakfastServed: 0,
          lunchNeeded: 0,
          lunchServed: 0,
          dinnerNeeded: 0,
          dinnerServed: 0,
        },
        error: residentsError.message,
        tableMissing: false,
      };
    }

    // 2. Fetch meal attendance for that date (up to 5000 to safely exceed 1000 resident scale)
    const { data: attendanceData, error: mealError } = await supabase
      .from('meal_attendance')
      .select('*')
      .eq('date', date)
      .limit(5000);

    const tableMissing = isMealTableMissing(mealError);

    // Map existing attendance by resident_id
    const attendanceMap = new Map<string, MealAttendance>();
    if (attendanceData) {
      for (const item of attendanceData) {
        attendanceMap.set(item.resident_id, item);
      }
    }

    // 3. Merge: Default to false for meals if resident hasn't opted in
    const records: ResidentMealRecord[] = (residents || []).map((r: any) => {
      const att = attendanceMap.get(r.id);
      return {
        resident_id: r.id,
        admission_no: r.admission_no,
        name: r.name,
        room_no: r.room_no,
        bed_no: r.bed_no,
        mobile_no: r.mobile_no,
        email: r.email,
        date,
        breakfast: att ? att.breakfast : false,
        lunch: att ? att.lunch : false,
        dinner: att ? att.dinner : false,
        breakfast_served: att ? att.breakfast_served : false,
        lunch_served: att ? att.lunch_served : false,
        dinner_served: att ? att.dinner_served : false,
        meal_attendance_id: att?.id,
        meals_per_day: r.meals_per_day || 3,
      };
    });

    // 4. Compute summary
    const summary: DailyMealSummary = {
      date,
      totalResidents: records.length,
      breakfastNeeded: records.filter((r) => r.breakfast).length,
      breakfastServed: records.filter((r) => r.breakfast && r.breakfast_served).length,
      lunchNeeded: records.filter((r) => r.lunch).length,
      lunchServed: records.filter((r) => r.lunch && r.lunch_served).length,
      dinnerNeeded: records.filter((r) => r.dinner).length,
      dinnerServed: records.filter((r) => r.dinner && r.dinner_served).length,
    };

    return {
      records,
      summary,
      error: tableMissing ? mealError?.message || null : null,
      tableMissing,
    };
  } catch (err: any) {
    return {
      records: [],
      summary: {
        date,
        totalResidents: 0,
        breakfastNeeded: 0,
        breakfastServed: 0,
        lunchNeeded: 0,
        lunchServed: 0,
        dinnerNeeded: 0,
        dinnerServed: 0,
      },
      error: err.message || 'Failed to fetch meal attendance records',
      tableMissing: false,
    };
  }
}

export interface MealServedRecord {
  breakfast?: boolean;
  lunch?: boolean;
  dinner?: boolean;
  breakfast_served?: boolean;
  lunch_served?: boolean;
  dinner_served?: boolean;
}

/**
 * Kitchen staff mark if a resident received their meal (Breakfast / Lunch / Dinner).
 * Safely preserves existing opted-in states and other meal served flags.
 */
export async function toggleMealServedStatus(
  residentId: string,
  date: string,
  mealType: MealType,
  currentServedStatus: boolean,
  currentRecord?: MealServedRecord
): Promise<{ success: boolean; error: string | null }> {
  try {
    const newStatus = !currentServedStatus;

    const payload: Record<string, any> = {
      resident_id: residentId,
      date,
      breakfast: currentRecord ? Boolean(currentRecord.breakfast) : false,
      lunch: currentRecord ? Boolean(currentRecord.lunch) : false,
      dinner: currentRecord ? Boolean(currentRecord.dinner) : false,
      breakfast_served:
        mealType === 'breakfast' ? newStatus : Boolean(currentRecord?.breakfast_served),
      lunch_served:
        mealType === 'lunch' ? newStatus : Boolean(currentRecord?.lunch_served),
      dinner_served:
        mealType === 'dinner' ? newStatus : Boolean(currentRecord?.dinner_served),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('meal_attendance')
      .upsert(payload, { onConflict: 'resident_id,date' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update served status' };
  }
}

/**
 * Fetches meal attendance records for a specific resident across an entire month.
 */
export async function getResidentMonthlyMealAttendance(
  residentId: string,
  year: number,
  month: number // 1-12
): Promise<{ data: MealAttendance[]; error: string | null; tableMissing: boolean }> {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('meal_attendance')
      .select('*')
      .eq('resident_id', residentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      if (isMealTableMissing(error)) {
        return { data: [], error: error.message, tableMissing: true };
      }
      return { data: [], error: error.message, tableMissing: false };
    }

    return { data: (data as MealAttendance[]) || [], error: null, tableMissing: false };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to fetch monthly meal attendance', tableMissing: false };
  }
}

