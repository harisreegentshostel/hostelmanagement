import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Save,
  Loader2,
  Coffee,
  Sun,
  Moon,
  AlertCircle,
  Copy,
  Check,
  Utensils,
  Clock,
  Lock
} from 'lucide-react';

import { supabase } from '../../lib/supabase';
import {
  getResidentMealPreference,
  saveResidentMealPreference,
  getTodayStr,
  getTomorrowStr,
  MEAL_TIMINGS,
  isMealCutoffPassed
} from '../../lib/meals';

interface MealPreferenceCardProps {
  residentId: string;
  mealsPerDay?: number | null;
}

export const MealPreferenceCard: React.FC<MealPreferenceCardProps> = ({
  residentId,
  mealsPerDay
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr);

  const [breakfast, setBreakfast] = useState(false);
  const [lunch, setLunch] = useState(false);
  const [dinner, setDinner] = useState(false);
  const [breakfastServed, setBreakfastServed] = useState(false);
  const [lunchServed, setLunchServed] = useState(false);
  const [dinnerServed, setDinnerServed] = useState(false);

  // Dynamic meal plan allowance (1, 2, or 3 meals/day, default 3)
  const [configuredMeals, setConfiguredMeals] = useState<number>(mealsPerDay || 3);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Periodic clock refresh (every 30s) to keep meal timings accurate in real-time
  const [, setClockTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Sync configured meal plan from prop or database
  useEffect(() => {
    if (typeof mealsPerDay === 'number' && mealsPerDay >= 1 && mealsPerDay <= 3) {
      setConfiguredMeals(mealsPerDay);
    } else if (residentId) {
      const fetchPlan = async () => {
        try {
          const { data } = await supabase
            .from('residents')
            .select('meals_per_day')
            .eq('id', residentId)
            .maybeSingle();
          if (data && typeof data.meals_per_day === 'number') {
            setConfiguredMeals(data.meals_per_day);
          }
        } catch (err) {
          console.warn('Could not fetch resident meals_per_day:', err);
        }
      };
      fetchPlan();
    }
  }, [residentId, mealsPerDay]);

  const maxMeals = Math.min(Math.max(configuredMeals || 3, 1), 3);

  // Calculate current selected count for active date
  const selectedCount = (breakfast ? 1 : 0) + (lunch ? 1 : 0) + (dinner ? 1 : 0);
  const isMaxReached = selectedCount >= maxMeals;

  const isToday = selectedDate === getTodayStr();
  const isTomorrow = selectedDate === getTomorrowStr();

  // 1. Kitchen Served Lock: If meal was already served by the kitchen, lock it
  const isBreakfastServedLock = isToday && breakfastServed;
  const isLunchServedLock = isToday && lunchServed;
  const isDinnerServedLock = isToday && dinnerServed;

  // 2. Cutoff Timing Lock: If the scheduled dining cutoff time has passed for today
  const isBreakfastTimeUp = isMealCutoffPassed('breakfast', selectedDate);
  const isLunchTimeUp = isMealCutoffPassed('lunch', selectedDate);
  const isDinnerTimeUp = isMealCutoffPassed('dinner', selectedDate);

  // Unselected meals become disabled if allowance reached, served by kitchen, or timing has ended
  const isBreakfastDisabled = isBreakfastServedLock || isBreakfastTimeUp || (isMaxReached && !breakfast);
  const isLunchDisabled = isLunchServedLock || isLunchTimeUp || (isMaxReached && !lunch);
  const isDinnerDisabled = isDinnerServedLock || isDinnerTimeUp || (isMaxReached && !dinner);

  const areAllMealsClosedToday = isToday && isBreakfastTimeUp && isLunchTimeUp && isDinnerTimeUp;

  /**
   * Renders the attached status badge ("Served ✓", "Opted In", "Skipped", "Not Included")
   */
  const getMealStatusBadge = (
    isMealOpted: boolean,
    isMealServedLock: boolean,
    isMealTimeUp: boolean,
    mealTheme: 'amber' | 'orange' | 'blue'
  ) => {
    // 1. Kitchen Served
    if (isMealServedLock) {
      return (
        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1 shrink-0">
          Served ✓
        </span>
      );
    }

    // 2. Opted In
    if (isMealOpted) {
      const themeColors = {
        amber: 'text-amber-800 bg-amber-100/90 border-amber-300/80',
        orange: 'text-orange-800 bg-orange-100/90 border-orange-300/80',
        blue: 'text-blue-800 bg-blue-100/90 border-blue-300/80',
      };
      return (
        <span
          className={`text-[10px] font-semibold ${themeColors[mealTheme]} px-2 py-0.5 rounded-full border inline-flex items-center gap-1 shrink-0`}
          title="Opted in and attached to your daily meal plan"
        >
          {isMealTimeUp && <Lock className="w-2.5 h-2.5 opacity-70" />}
          Opted In
        </span>
      );
    }

    // 3. Daily plan limit reached on other meals
    if (isMaxReached) {
      return (
        <span
          className="text-[10px] text-[#86868b] bg-[#f2f2f7] px-2 py-0.5 rounded-full font-medium border border-black/[0.04] shrink-0"
          title={`Not included (daily allowance of ${maxMeals} meals reached)`}
        >
          Not Included
        </span>
      );
    }

    // 4. Skipped / not selected
    return (
      <span
        className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 font-medium shrink-0"
        title={isMealTimeUp ? "Meal was skipped and timing has ended" : "Currently skipped"}
      >
        Skipped
      </span>
    );
  };

  const toggleBreakfast = () => {
    if (isBreakfastServedLock) {
      setErrorMsg('Breakfast has already been served by the kitchen today and cannot be deselected.');
      return;
    }
    if (isBreakfastTimeUp) {
      setErrorMsg(`Breakfast timing has ended for today (${MEAL_TIMINGS.breakfast.formattedWindow}). Selection is closed.`);
      return;
    }
    if (!breakfast && selectedCount >= maxMeals) {
      setErrorMsg(`Your meal plan allows ${maxMeals} ${maxMeals === 1 ? 'meal' : 'meals'} per day. Deselect a meal first.`);
      return;
    }
    setBreakfast((prev) => !prev);
  };

  const toggleLunch = () => {
    if (isLunchServedLock) {
      setErrorMsg('Lunch has already been served by the kitchen today and cannot be deselected.');
      return;
    }
    if (isLunchTimeUp) {
      setErrorMsg(`Lunch timing has ended for today (${MEAL_TIMINGS.lunch.formattedWindow}). Selection is closed.`);
      return;
    }
    if (!lunch && selectedCount >= maxMeals) {
      setErrorMsg(`Your meal plan allows ${maxMeals} ${maxMeals === 1 ? 'meal' : 'meals'} per day. Deselect a meal first.`);
      return;
    }
    setLunch((prev) => !prev);
  };

  const toggleDinner = () => {
    if (isDinnerServedLock) {
      setErrorMsg('Dinner has already been served by the kitchen today and cannot be deselected.');
      return;
    }
    if (isDinnerTimeUp) {
      setErrorMsg(`Dinner timing has ended for today (${MEAL_TIMINGS.dinner.formattedWindow}). Selection is closed.`);
      return;
    }
    if (!dinner && selectedCount >= maxMeals) {
      setErrorMsg(`Your meal plan allows ${maxMeals} ${maxMeals === 1 ? 'meal' : 'meals'} per day. Deselect a meal first.`);
      return;
    }
    setDinner((prev) => !prev);
  };

  const fetchPreference = useCallback(async (date: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setTableMissing(false);

    const res = await getResidentMealPreference(residentId, date);
    if (res.tableMissing) {
      setTableMissing(true);
      setLoading(false);
      return;
    }

    if (res.error) {
      setErrorMsg(res.error);
    } else if (res.data) {
      setBreakfast(res.data.breakfast);
      setLunch(res.data.lunch);
      setDinner(res.data.dinner);
      setBreakfastServed(Boolean(res.data.breakfast_served));
      setLunchServed(Boolean(res.data.lunch_served));
      setDinnerServed(Boolean(res.data.dinner_served));
    } else {
      // Default: turned off until resident explicitly selects and saves
      setBreakfast(false);
      setLunch(false);
      setDinner(false);
      setBreakfastServed(false);
      setLunchServed(false);
      setDinnerServed(false);
    }
    setLoading(false);
  }, [residentId]);

  useEffect(() => {
    fetchPreference(selectedDate);
  }, [selectedDate, fetchPreference]);

  const handleSave = async () => {
    const totalSelected = (breakfast ? 1 : 0) + (lunch ? 1 : 0) + (dinner ? 1 : 0);
    if (totalSelected > maxMeals) {
      setErrorMsg(`Your configured meal plan allows a maximum of ${maxMeals} ${maxMeals === 1 ? 'meal' : 'meals'} per day.`);
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await saveResidentMealPreference(residentId, selectedDate, {
      breakfast,
      lunch,
      dinner,
    });

    setSaving(false);

    if (res.tableMissing) {
      setTableMissing(true);
      return;
    }

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg(
        `Meal choices for ${selectedDate === getTodayStr() ? 'Today' : 'Tomorrow'} saved successfully!`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const copySqlSnippet = () => {
    const sql = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.meal_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    breakfast BOOLEAN NOT NULL DEFAULT false,
    lunch BOOLEAN NOT NULL DEFAULT false,
    dinner BOOLEAN NOT NULL DEFAULT false,
    breakfast_served BOOLEAN NOT NULL DEFAULT false,
    lunch_served BOOLEAN NOT NULL DEFAULT false,
    dinner_served BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT meal_attendance_resident_date_key UNIQUE (resident_id, date)
);
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS meals_per_day INTEGER DEFAULT 3;
ALTER TABLE public.meal_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access to meal_attendance" ON public.meal_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read of meal_attendance" ON public.meal_attendance FOR SELECT TO anon USING (true);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Nice date labels
  const now = new Date();
  const todayLabel = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowLabel = tomorrowDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="bg-white rounded-3xl border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-6 space-y-4 sm:space-y-5">
      {/* Header & Date Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4 text-amber-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[#1d1d1f] tracking-tight leading-none truncate">
                Food Selection
              </h2>
              <p className="text-[11px] text-[#86868b] mt-0.5 truncate">Choose your meals for dining</p>
            </div>
          </div>

          {/* Dynamic Meal Plan Badge - Attached to Plan */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="text-[11px] font-semibold text-amber-800 bg-amber-50/90 px-2.5 py-1 rounded-full border border-amber-200/80 flex items-center gap-1"
              title={`Admin configured plan: ${maxMeals} ${maxMeals === 1 ? 'meal' : 'meals'} per day attached to resident profile`}
            >
              <span>{maxMeals} Meals / Day</span>
              <span className="opacity-60 hidden sm:inline">• Attached to Plan</span>
            </span>
          </div>
        </div>

        {/* Date Selector Segmented Control (iOS style) */}
        <div className="grid grid-cols-2 p-1 bg-[#f2f2f7] rounded-2xl border border-black/[0.04]">
          <button
            type="button"
            onClick={() => setSelectedDate(getTodayStr())}
            className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isToday
                ? 'bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <span>Today</span>
            <span className={`text-[10px] font-normal ${isToday ? 'text-[#86868b]' : 'opacity-70'}`}>
              ({todayLabel})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(getTomorrowStr())}
            className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isTomorrow
                ? 'bg-white text-[#1d1d1f] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            <span>Tomorrow</span>
            <span className={`text-[10px] font-normal ${isTomorrow ? 'text-[#86868b]' : 'opacity-70'}`}>
              ({tomorrowLabel})
            </span>
          </button>
        </div>
      </div>

      {/* Database Setup Notice if table not yet created */}
      {tableMissing && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Meal Attendance Table Setup</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                The <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">meal_attendance</code> table needs to be created in your Supabase project.
              </p>
            </div>
          </div>
          <button
            onClick={copySqlSnippet}
            className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-100 hover:bg-amber-200/80 text-amber-900 border border-amber-300/60 transition cursor-pointer"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
          </button>
        </div>
      )}

      {/* Today Closed Banner (when all meal sessions have ended) */}
      {isToday && areAllMealsClosedToday && !loading && (
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-[11px]">
              All meal timings for Today have ended. Selections are locked.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(getTomorrowStr())}
            className="text-[11px] font-bold text-[#011627] hover:underline shrink-0 cursor-pointer"
          >
            Select Tomorrow →
          </button>
        </div>
      )}

      {/* Dynamic Allowance Status Hint */}
      {isMaxReached && maxMeals < 3 && !loading && !areAllMealsClosedToday && (
        <div className="p-2.5 px-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate text-[11px]">
              Daily allowance reached ({maxMeals}/{maxMeals} selected).
            </span>
          </div>
          <span className="text-[10px] text-amber-700 font-semibold shrink-0">
            Uncheck to pick another
          </span>
        </div>
      )}

      {/* Alerts */}
      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium text-[11px] sm:text-xs">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium text-[11px] sm:text-xs">{errorMsg}</span>
        </div>
      )}

      {/* Meal Selection Cards (Breakfast, Lunch, Dinner) */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-[#86868b]">
          <Loader2 className="w-6 h-6 animate-spin text-[#011627] mb-2" />
          <span className="text-xs">Loading preferences for {isToday ? 'Today' : 'Tomorrow'}...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 1. BREAKFAST */}
          <div
            onClick={toggleBreakfast}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between select-none ${
              isBreakfastDisabled
                ? 'bg-[#f7f7f9] border-black/[0.05] opacity-75 cursor-not-allowed'
                : breakfast
                ? 'bg-amber-50/40 border-amber-300/80 shadow-[0_2px_8px_rgba(245,158,11,0.08)] cursor-pointer active:scale-[0.99]'
                : 'bg-white border-black/[0.08] hover:border-black/[0.16] cursor-pointer active:scale-[0.99]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  breakfast
                    ? 'bg-amber-500 text-white shadow-xs'
                    : isBreakfastDisabled
                    ? 'bg-[#eaeaea] text-[#86868b]'
                    : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                }`}
              >
                <Coffee className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                  <h3 className="text-sm font-bold text-[#1d1d1f] leading-none">
                    Breakfast
                  </h3>
                  {/* Status Badge: Served ✓ | Opted In | Skipped | Not Included */}
                  {getMealStatusBadge(breakfast, isBreakfastServedLock, isBreakfastTimeUp, 'amber')}

                  {/* Cutoff Timing Badge: Time's Up if window ended */}
                  {isBreakfastTimeUp && (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/70 inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      Time&apos;s Up
                    </span>
                  )}
                </div>

                {/* Scheduled Time Window & Cutoff Hint */}
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#86868b]">
                  <span className="font-mono">{MEAL_TIMINGS.breakfast.formattedWindow}</span>
                  {isBreakfastTimeUp ? (
                    <span className="text-rose-600 font-medium text-[10px]">
                      • Ended {MEAL_TIMINGS.breakfast.cutoffDisplay}
                    </span>
                  ) : isToday ? (
                    <span className="text-emerald-700 font-medium text-[10px]">
                      • Open until {MEAL_TIMINGS.breakfast.cutoffDisplay}
                    </span>
                  ) : (
                    <span className="text-[#86868b] text-[10px]">• Tomorrow</span>
                  )}
                </div>
              </div>
            </div>

            <label
              className={`relative inline-flex items-center shrink-0 ml-3 ${
                isBreakfastDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleBreakfast();
              }}
            >
              <input
                type="checkbox"
                checked={breakfast}
                disabled={isBreakfastDisabled}
                onChange={() => {}}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#e5e5ea] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-disabled:opacity-40"></div>
            </label>
          </div>

          {/* 2. LUNCH */}
          <div
            onClick={toggleLunch}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between select-none ${
              isLunchDisabled
                ? 'bg-[#f7f7f9] border-black/[0.05] opacity-75 cursor-not-allowed'
                : lunch
                ? 'bg-orange-50/40 border-orange-300/80 shadow-[0_2px_8px_rgba(249,115,22,0.08)] cursor-pointer active:scale-[0.99]'
                : 'bg-white border-black/[0.08] hover:border-black/[0.16] cursor-pointer active:scale-[0.99]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  lunch
                    ? 'bg-orange-500 text-white shadow-xs'
                    : isLunchDisabled
                    ? 'bg-[#eaeaea] text-[#86868b]'
                    : 'bg-orange-50 text-orange-700 border border-orange-200/60'
                }`}
              >
                <Sun className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                  <h3 className="text-sm font-bold text-[#1d1d1f] leading-none">
                    Lunch
                  </h3>
                  {/* Status Badge: Served ✓ | Opted In | Skipped | Not Included */}
                  {getMealStatusBadge(lunch, isLunchServedLock, isLunchTimeUp, 'orange')}

                  {/* Cutoff Timing Badge: Time's Up if window ended */}
                  {isLunchTimeUp && (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/70 inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      Time&apos;s Up
                    </span>
                  )}
                </div>

                {/* Scheduled Time Window & Cutoff Hint */}
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#86868b]">
                  <span className="font-mono">{MEAL_TIMINGS.lunch.formattedWindow}</span>
                  {isLunchTimeUp ? (
                    <span className="text-rose-600 font-medium text-[10px]">
                      • Ended {MEAL_TIMINGS.lunch.cutoffDisplay}
                    </span>
                  ) : isToday ? (
                    <span className="text-emerald-700 font-medium text-[10px]">
                      • Open until {MEAL_TIMINGS.lunch.cutoffDisplay}
                    </span>
                  ) : (
                    <span className="text-[#86868b] text-[10px]">• Tomorrow</span>
                  )}
                </div>
              </div>
            </div>

            <label
              className={`relative inline-flex items-center shrink-0 ml-3 ${
                isLunchDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleLunch();
              }}
            >
              <input
                type="checkbox"
                checked={lunch}
                disabled={isLunchDisabled}
                onChange={() => {}}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#e5e5ea] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 peer-disabled:opacity-40"></div>
            </label>
          </div>

          {/* 3. DINNER */}
          <div
            onClick={toggleDinner}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between select-none ${
              isDinnerDisabled
                ? 'bg-[#f7f7f9] border-black/[0.05] opacity-75 cursor-not-allowed'
                : dinner
                ? 'bg-blue-50/40 border-blue-300/80 shadow-[0_2px_8px_rgba(37,99,235,0.08)] cursor-pointer active:scale-[0.99]'
                : 'bg-white border-black/[0.08] hover:border-black/[0.16] cursor-pointer active:scale-[0.99]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                  dinner
                    ? 'bg-[#011627] text-white shadow-xs'
                    : isDinnerDisabled
                    ? 'bg-[#eaeaea] text-[#86868b]'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Moon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                  <h3 className="text-sm font-bold text-[#1d1d1f] leading-none">
                    Dinner
                  </h3>
                  {/* Status Badge: Served ✓ | Opted In | Skipped | Not Included */}
                  {getMealStatusBadge(dinner, isDinnerServedLock, isDinnerTimeUp, 'blue')}

                  {/* Cutoff Timing Badge: Time's Up if window ended */}
                  {isDinnerTimeUp && (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/70 inline-flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      Time&apos;s Up
                    </span>
                  )}
                </div>

                {/* Scheduled Time Window & Cutoff Hint */}
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#86868b]">
                  <span className="font-mono">{MEAL_TIMINGS.dinner.formattedWindow}</span>
                  {isDinnerTimeUp ? (
                    <span className="text-rose-600 font-medium text-[10px]">
                      • Ended {MEAL_TIMINGS.dinner.cutoffDisplay}
                    </span>
                  ) : isToday ? (
                    <span className="text-emerald-700 font-medium text-[10px]">
                      • Open until {MEAL_TIMINGS.dinner.cutoffDisplay}
                    </span>
                  ) : (
                    <span className="text-[#86868b] text-[10px]">• Tomorrow</span>
                  )}
                </div>
              </div>
            </div>

            <label
              className={`relative inline-flex items-center shrink-0 ml-3 ${
                isDinnerDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleDinner();
              }}
            >
              <input
                type="checkbox"
                checked={dinner}
                disabled={isDinnerDisabled}
                onChange={() => {}}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#e5e5ea] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#011627] peer-disabled:opacity-40"></div>
            </label>
          </div>

          {/* Full-width Mobile Save Button & Summary */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#86868b] w-full sm:w-auto text-center sm:text-left">
              Selected: <strong className="text-[#1d1d1f]">{selectedCount}</strong> of <strong className="text-[#1d1d1f]">{maxMeals}</strong> {maxMeals === 1 ? 'meal' : 'meals'}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold text-white bg-[#011627] hover:bg-[#0b253a] shadow-md shadow-[#011627]/10 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Choices...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Food Preference</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
