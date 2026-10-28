export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealAttendance {
  id: string;
  resident_id: string;
  date: string; // YYYY-MM-DD
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  breakfast_served: boolean;
  lunch_served: boolean;
  dinner_served: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ResidentMealRecord {
  resident_id: string;
  admission_no: number;
  name: string;
  room_no: string;
  bed_no: string;
  mobile_no: string;
  email: string;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  breakfast_served: boolean;
  lunch_served: boolean;
  dinner_served: boolean;
  meal_attendance_id?: string;
  meals_per_day?: number | null;
}

export interface DailyMealSummary {
  date: string;
  totalResidents: number;
  breakfastNeeded: number;
  breakfastServed: number;
  lunchNeeded: number;
  lunchServed: number;
  dinnerNeeded: number;
  dinnerServed: number;
}
