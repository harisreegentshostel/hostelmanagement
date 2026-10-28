import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Utensils,
  Coffee,
  Sun,
  Moon,
  ArrowRight,
  RefreshCw,
  Building2,
  ChevronRight,
  Clock,
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { getAllResidentsMealAttendance, getTodayStr, getCurrentMealType } from '../../lib/meals';
import type { DailyMealSummary } from '../../types/meals';
import type { ResidentRecord } from '../../types/auth';
import type { AdminTab } from './AdminSidebar';

interface AdminOverviewViewProps {
  residents: ResidentRecord[];
  loading: boolean;
  totalMonthlyRent: number;
  totalRentCollectedThisMonth: number;
  totalDueRemainingThisMonth: number;
  pendingCount: number;
  onOpenAddResident: () => void;
  onNavigateTab: (tab: AdminTab) => void;
  onViewResidentDetails: (resident: ResidentRecord) => void;
  onRefreshAll: () => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  residents,
  loading: parentLoading,
  totalMonthlyRent: _totalMonthlyRent,
  totalDueRemainingThisMonth,
  pendingCount,
  onNavigateTab,
  onRefreshAll,
}) => {
  const todayStr = getTodayStr();
  const currentMeal = getCurrentMealType();
  const clearedCount = residents.filter((r) => Number(r.pending || 0) <= 0).length;

  const [mealSummary, setMealSummary] = useState<DailyMealSummary>({
    date: todayStr,
    totalResidents: 0,
    breakfastNeeded: 0,
    breakfastServed: 0,
    lunchNeeded: 0,
    lunchServed: 0,
    dinnerNeeded: 0,
    dinnerServed: 0,
  });
  const [mealLoading, setMealLoading] = useState(true);

  const fetchTodayFoodData = useCallback(async () => {
    setMealLoading(true);
    try {
      const res = await getAllResidentsMealAttendance(todayStr);
      setMealSummary(res.summary);
    } catch (err) {
      console.error('Error fetching today meal data in overview:', err);
    } finally {
      setMealLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    fetchTodayFoodData();
  }, [fetchTodayFoodData]);

  const handleRefresh = async () => {
    onRefreshAll();
    await fetchTodayFoodData();
  };

  const isRefreshing = mealLoading || parentLoading;

  return (
    <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0 space-y-4 pb-6">
      {/* 1. NATIVE MOBILE APP TOP BAR */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-black/[0.06] flex items-center justify-between sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.03)] sm:rounded-2xl sm:border sm:static">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#011627] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-[#1d1d1f] tracking-tight leading-none">
                Harisree Hostel
              </h1>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#011627]/[0.08] text-[#011627] uppercase">
                Admin
              </span>
            </div>
            <p className="text-[11px] text-[#86868b] mt-0.5 font-medium">
              Overview
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh overview"
          className="w-9 h-9 rounded-full bg-[#f5f5f7] hover:bg-[#ebebed] text-[#1d1d1f] flex items-center justify-center active:scale-95 transition cursor-pointer border border-black/[0.04]"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#011627]' : 'text-[#6e6e73]'}`}
          />
        </button>
      </div>

      <div className="px-4 sm:px-0 space-y-4">
        {/* 2. SUMMARY METRIC HERO CARD (INSIDE SINGLE CONTAINER LIKE MEALS & FEE PAGES) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
              Hostel Fee Overview
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* 1. Fee Paid */}
            <div
              onClick={() => onNavigateTab('dues')}
              className="p-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/50 text-center transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate">Fee Paid</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-950 mt-1">
                {clearedCount}
              </div>
              <span className="text-[9px] text-emerald-700 block mt-0.5 font-medium">
                Residents
              </span>
            </div>

            {/* 2. Fee Pending */}
            <div
              onClick={() => onNavigateTab('dues')}
              className="p-3 rounded-2xl border border-rose-200/70 bg-rose-50/50 text-center transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800 mb-0.5">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span className="truncate">Fee Pending</span>
              </div>
              <div className="text-xl font-bold font-mono text-rose-950 mt-1">
                {pendingCount}
              </div>
              <span className="text-[9px] text-rose-700 block mt-0.5 font-medium">
                Residents
              </span>
            </div>

            {/* 3. Total Due */}
            <div
              onClick={() => onNavigateTab('dues')}
              className="p-3 rounded-2xl border border-rose-200/70 bg-rose-50/50 text-center transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span className="truncate">Total Due</span>
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-rose-950 mt-1 truncate px-0.5">
                ₹{totalDueRemainingThisMonth.toLocaleString()}
              </div>
              <span className="text-[9px] text-rose-700 block mt-0.5 font-medium">
                Due amount
              </span>
            </div>
          </div>
        </div>

        {/* 3. TODAY'S FOOD HERO WIDGET */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
          {/* Card Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1d1d1f] leading-none">
                Today&apos;s Food Details
              </h2>
              <span className="text-[11px] text-[#86868b] mt-0.5 block">
                Today&apos;s Mess Schedule
              </span>
            </div>
          </div>

          {/* Meal Sessions: Mobile List Rows */}
          <div className="space-y-3.5 pt-1">
            {/* Breakfast Row */}
            <div
              className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                currentMeal === 'breakfast'
                  ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/40'
                  : 'bg-[#fbfbfd] border-black/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#1d1d1f]">Breakfast</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-right">
                <div>
                  <span className="text-[10px] text-[#86868b] block leading-none uppercase font-semibold">Opted</span>
                  <span className="text-sm font-bold font-mono text-[#1d1d1f] block mt-0.5">
                    {mealSummary.breakfastNeeded}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block leading-none uppercase font-semibold">Served</span>
                  <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">
                    {mealSummary.breakfastServed}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-700 block leading-none uppercase font-semibold">Pending</span>
                  <span className="text-sm font-bold font-mono text-rose-700 block mt-0.5">
                    {Math.max(0, mealSummary.breakfastNeeded - mealSummary.breakfastServed)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lunch Row */}
            <div
              className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                currentMeal === 'lunch'
                  ? 'bg-orange-50/50 border-orange-300 ring-1 ring-orange-300/50'
                  : 'bg-[#fbfbfd] border-black/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-100/70 text-orange-800 flex items-center justify-center shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#1d1d1f]">Lunch</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-right">
                <div>
                  <span className="text-[10px] text-[#86868b] block leading-none uppercase font-semibold">Opted</span>
                  <span className="text-sm font-bold font-mono text-[#1d1d1f] block mt-0.5">
                    {mealSummary.lunchNeeded}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block leading-none uppercase font-semibold">Served</span>
                  <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">
                    {mealSummary.lunchServed}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-orange-700 block leading-none uppercase font-semibold">Pending</span>
                  <span className="text-sm font-bold font-mono text-orange-700 block mt-0.5">
                    {Math.max(0, mealSummary.lunchNeeded - mealSummary.lunchServed)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dinner Row */}
            <div
              className={`p-4 rounded-2xl border transition flex items-center justify-between ${
                currentMeal === 'dinner'
                  ? 'bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-300/40'
                  : 'bg-[#fbfbfd] border-black/[0.04]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#011627]/10 text-[#011627] flex items-center justify-center shrink-0">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-[#1d1d1f]">Dinner</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 text-right">
                <div>
                  <span className="text-[10px] text-[#86868b] block leading-none uppercase font-semibold">Opted</span>
                  <span className="text-sm font-bold font-mono text-[#1d1d1f] block mt-0.5">
                    {mealSummary.dinnerNeeded}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block leading-none uppercase font-semibold">Served</span>
                  <span className="text-sm font-bold font-mono text-emerald-700 block mt-0.5">
                    {mealSummary.dinnerServed}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-indigo-700 block leading-none uppercase font-semibold">Pending</span>
                  <span className="text-sm font-bold font-mono text-indigo-700 block mt-0.5">
                    {Math.max(0, mealSummary.dinnerNeeded - mealSummary.dinnerServed)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Button: Jump to Daily Mess */}
          <button
            type="button"
            onClick={() => onNavigateTab('meals')}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200/80 text-xs sm:text-sm font-semibold transition active:scale-[0.98] cursor-pointer shadow-2xs"
          >
            <span>Open Daily Mess Attendance</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4. QUICK NAVIGATION MOBILE DOCK PILLS */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onNavigateTab('residents')}
            className="flex items-center justify-between py-3.5 px-4 rounded-2xl bg-white border border-black/[0.06] text-xs sm:text-sm font-semibold text-[#1d1d1f] shadow-2xs hover:bg-[#f8f9fa] active:scale-95 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#011627]" />
              <span>Residents List</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('dues')}
            className="flex items-center justify-between py-3.5 px-4 rounded-2xl bg-white border border-black/[0.06] text-xs sm:text-sm font-semibold text-[#1d1d1f] shadow-2xs hover:bg-[#f8f9fa] active:scale-95 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Fee Details</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" />
          </button>
        </div>
      </div>
    </div>
  );
};
