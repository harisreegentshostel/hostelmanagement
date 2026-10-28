import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Utensils,
  Coffee,
  Sun,
  Moon,
  RotateCcw,
  Loader2,
  CalendarDays,
  CheckCircle2
} from 'lucide-react';
import { getResidentMonthlyMealAttendance } from '../../lib/meals';
import type { MealAttendance } from '../../types/meals';

interface MonthlyMealHeatmapProps {
  residentId: string;
  mealsPerDay?: number | null;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const WEEKDAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const MonthlyMealHeatmap: React.FC<MonthlyMealHeatmapProps> = ({ residentId, mealsPerDay = 3 }) => {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayFormatted(d)}`;
  }, [today]);

  function dayFormatted(d: string | number) {
    return String(d).padStart(2, '0');
  }

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [attendanceRecords, setAttendanceRecords] = useState<MealAttendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  // Fetch monthly records from DB
  const loadMonthlyData = useCallback(async (year: number, month: number) => {
    setLoading(true);
    const res = await getResidentMonthlyMealAttendance(residentId, year, month);
    setAttendanceRecords(res.data);
    setLoading(false);
  }, [residentId]);

  useEffect(() => {
    loadMonthlyData(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, loadMonthlyData]);

  // Map records by date string YYYY-MM-DD
  const attendanceMap = useMemo(() => {
    const map = new Map<string, MealAttendance>();
    for (const record of attendanceRecords) {
      map.set(record.date, record);
    }
    return map;
  }, [attendanceRecords]);

  // Navigate months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setSelectedDate(todayStr);
  };

  const isCurrentMonthView = selectedYear === currentYear && selectedMonth === currentMonth;

  const getHistoricalMealStatus = (mealKey: 'breakfast' | 'lunch' | 'dinner', isOpted: boolean, record?: MealAttendance) => {
    if (!record) return 'Skipped';
    const isServed =
      mealKey === 'breakfast'
        ? Boolean(record.breakfast_served)
        : mealKey === 'lunch'
        ? Boolean(record.lunch_served)
        : Boolean(record.dinner_served);

    if (isServed) return 'Served ✓';
    if (isOpted) return 'Opted In';
    const totalTaken = (record.breakfast ? 1 : 0) + (record.lunch ? 1 : 0) + (record.dinner ? 1 : 0);
    if (totalTaken >= (mealsPerDay || 3)) {
      return 'Not Included';
    }
    return 'Skipped';
  };


  // Calendar calculations
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 = Sun, 1 = Mon ...
  }, [selectedYear, selectedMonth]);

  // Generate calendar days array
  const calendarDays = useMemo(() => {
    const days: Array<{
      dayNumber: number;
      dateStr: string;
      record?: MealAttendance;
      mealCount: number;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = attendanceMap.get(dateStr);
      let count = 0;
      if (record?.breakfast) count += 1;
      if (record?.lunch) count += 1;
      if (record?.dinner) count += 1;

      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      days.push({
        dayNumber: day,
        dateStr,
        record,
        mealCount: count,
        isToday,
        isFuture,
      });
    }

    return days;
  }, [selectedYear, selectedMonth, daysInMonth, attendanceMap, todayStr]);

  // Monthly statistics
  const monthlyStats = useMemo(() => {
    let totalMeals = 0;
    let daysWithMeals = 0;
    for (const d of calendarDays) {
      if (d.mealCount > 0) {
        totalMeals += d.mealCount;
        daysWithMeals += 1;
      }
    }
    return {
      totalMeals,
      daysWithMeals,
    };
  }, [calendarDays]);

  // Details for selected day
  const activeDayDetail = useMemo(() => {
    if (!selectedDate) return null;
    const day = calendarDays.find((d) => d.dateStr === selectedDate);
    if (!day) return null;

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    return {
      ...day,
      formattedDate,
    };
  }, [selectedDate, calendarDays]);

  const getCellColorClass = (mealCount: number, isSelected: boolean) => {
    if (isSelected) {
      if (mealCount === 3) return 'bg-[#011627] text-white shadow-md ring-2 ring-[#011627] ring-offset-2';
      if (mealCount === 2) return 'bg-[#011627] text-white shadow-md ring-2 ring-[#011627] ring-offset-2';
      if (mealCount === 1) return 'bg-[#011627] text-white shadow-md ring-2 ring-[#011627] ring-offset-2';
      return 'bg-[#011627] text-white shadow-md ring-2 ring-[#011627] ring-offset-2';
    }

    switch (mealCount) {
      case 3:
        return 'bg-emerald-500 text-white font-bold shadow-2xs hover:bg-emerald-600';
      case 2:
        return 'bg-emerald-400 text-white font-semibold hover:bg-emerald-500';
      case 1:
        return 'bg-emerald-100 text-emerald-900 border border-emerald-300/60 font-medium hover:bg-emerald-200';
      case 0:
      default:
        return 'bg-[#f2f2f7] text-[#86868b] hover:bg-[#e5e5ea]';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-6 space-y-4">
      {/* Month Navigation & Stats Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1d1d1f] tracking-tight leading-none">
                Meal Calendar
              </h2>
              <p className="text-[11px] text-[#86868b] mt-0.5">Track your daily dining attendance</p>
            </div>
          </div>

          {!isCurrentMonthView && (
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-[#011627] bg-[#f2f2f7] hover:bg-[#e5e5ea] border border-black/[0.04] transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Today</span>
            </button>
          )}
        </div>

        {/* Month Selector Carousel Bar */}
        <div className="flex items-center justify-between bg-[#f2f2f7] p-1 rounded-2xl border border-black/[0.04]">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#515154] hover:text-[#1d1d1f] hover:bg-white transition cursor-pointer shadow-2xs"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-xs sm:text-sm text-[#1d1d1f] select-none tracking-tight">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#515154] hover:text-[#1d1d1f] hover:bg-white transition cursor-pointer shadow-2xs"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Month Metrics Strip */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-[#fafafc] border border-black/[0.04] flex items-center justify-center gap-2">
            <Utensils className="w-3.5 h-3.5 text-amber-600" />
            <div className="text-left">
              <span className="text-[10px] text-[#86868b] uppercase font-semibold block leading-none">Meals Taken</span>
              <span className="text-xs font-bold text-[#1d1d1f] font-mono mt-0.5 block">{monthlyStats.totalMeals} Meals</span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#fafafc] border border-black/[0.04] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <div className="text-left">
              <span className="text-[10px] text-[#86868b] uppercase font-semibold block leading-none">Days Active</span>
              <span className="text-xs font-bold text-[#1d1d1f] font-mono mt-0.5 block">{monthlyStats.daysWithMeals} Days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-[#86868b]">
          <Loader2 className="w-6 h-6 animate-spin text-[#011627] mb-2" />
          <span className="text-xs">Loading attendance...</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_NAMES.map((wkd, idx) => (
              <span
                key={idx}
                className="text-[11px] font-bold text-[#86868b] py-1 select-none"
              >
                {wkd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty slots before Day 1 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-2xl bg-transparent pointer-events-none"
              />
            ))}

            {/* Month Days */}
            {calendarDays.map((day) => {
              const isSelected = selectedDate === day.dateStr;
              const colorClass = getCellColorClass(day.mealCount, isSelected);

              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(day.dateStr)}
                  title={`${day.dateStr}: ${day.mealCount} of 3 meals`}
                  className={`aspect-square rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center relative p-1 active:scale-95 ${colorClass} ${
                    day.isToday && !isSelected ? 'ring-2 ring-[#011627] font-bold' : ''
                  }`}
                >
                  <span className="text-xs font-bold leading-none">
                    {day.dayNumber}
                  </span>

                  {/* Micro indicator dots for active meals */}
                  {day.mealCount > 0 && !isSelected && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: day.mealCount }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-1 h-1 rounded-full ${
                            day.mealCount >= 2 ? 'bg-white' : 'bg-emerald-800'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Selected indicator dots */}
                  {day.mealCount > 0 && isSelected && (
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: day.mealCount }).map((_, idx) => (
                        <span
                          key={idx}
                          className="w-1 h-1 rounded-full bg-white/80"
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Heatmap Legend */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-[#86868b] border-t border-black/[0.04]">
            <span className="text-[10px]">Tap date to inspect</span>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">Skipped</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#f2f2f7] border border-black/[0.06] inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-300 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-[10px]">3 Meals</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Day Meal Breakdown Card */}
      {activeDayDetail && (
        <div className="pt-3 border-t border-black/[0.06] space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1d1d1f]">
                {activeDayDetail.formattedDate}
              </span>
              {activeDayDetail.isToday && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Today
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-[#86868b]">
              {activeDayDetail.mealCount} of 3 meals taken
            </span>
          </div>

          {/* 3 Pills */}
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                activeDayDetail.record?.breakfast
                  ? 'bg-amber-50/70 border border-amber-200 text-amber-900 shadow-2xs font-semibold'
                  : 'bg-[#f8f9fa] border border-black/[0.04] text-[#86868b]'
              }`}
            >
              <Coffee className={`w-3.5 h-3.5 mb-1 ${activeDayDetail.record?.breakfast ? 'text-amber-600' : 'text-[#86868b]'}`} />
              <span className="text-[11px] leading-tight">Breakfast</span>
              <span className="text-[10px] font-bold mt-0.5 font-mono">
                {getHistoricalMealStatus('breakfast', Boolean(activeDayDetail.record?.breakfast), activeDayDetail.record)}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                activeDayDetail.record?.lunch
                  ? 'bg-orange-50/70 border border-orange-200 text-orange-900 shadow-2xs font-semibold'
                  : 'bg-[#f8f9fa] border border-black/[0.04] text-[#86868b]'
              }`}
            >
              <Sun className={`w-3.5 h-3.5 mb-1 ${activeDayDetail.record?.lunch ? 'text-orange-600' : 'text-[#86868b]'}`} />
              <span className="text-[11px] leading-tight">Lunch</span>
              <span className="text-[10px] font-bold mt-0.5 font-mono">
                {getHistoricalMealStatus('lunch', Boolean(activeDayDetail.record?.lunch), activeDayDetail.record)}
              </span>
            </div>

            <div
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                activeDayDetail.record?.dinner
                  ? 'bg-blue-50/70 border border-blue-200 text-blue-900 shadow-2xs font-semibold'
                  : 'bg-[#f8f9fa] border border-black/[0.04] text-[#86868b]'
              }`}
            >
              <Moon className={`w-3.5 h-3.5 mb-1 ${activeDayDetail.record?.dinner ? 'text-blue-600' : 'text-[#86868b]'}`} />
              <span className="text-[11px] leading-tight">Dinner</span>
              <span className="text-[10px] font-bold mt-0.5 font-mono">
                {getHistoricalMealStatus('dinner', Boolean(activeDayDetail.record?.dinner), activeDayDetail.record)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
