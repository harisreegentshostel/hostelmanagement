import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { KitchenSidebar, type KitchenView } from '../../components/kitchen/KitchenSidebar';
import { StaffFloatingBottomNav } from '../../components/kitchen/StaffFloatingBottomNav';
import { KitchenAccountView } from '../../components/kitchen/KitchenAccountView';
import { KitchenDatePicker } from '../../components/kitchen/KitchenDatePicker';
import { PwaInstallPrompt } from '../../components/PwaInstallPrompt';
import {
  Utensils,
  Search,
  Coffee,
  Sun,
  Moon,
  Check,
  AlertCircle,
  Copy,
  DoorOpen,
  RefreshCw,
  Loader2,
  Menu,
  LogOut,
  CheckCircle2,
  Timer,
  ChevronLeft,
  ChevronRight,
  Clock,
  X
} from 'lucide-react';

import {
  getAllResidentsMealAttendance,
  toggleMealServedStatus,
  getTodayStr,
  getCurrentMealType,
  getMealTimeWindow,
} from '../../lib/meals';
import type { ResidentMealRecord, DailyMealSummary, MealType } from '../../types/meals';

export const KitchenDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login?staff');
  };

  // Sidebar responsive state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('harisree_kitchen_sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsed((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      localStorage.setItem('harisree_kitchen_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Primary pages: 'overview' (live details for that time) | 'account' (staff account details)
  const [activeView, setActiveView] = useState<KitchenView>('overview');

  // Real-time meal detection based on local time of day (Breakfast / Lunch / Dinner)
  const [currentAutoMeal, setCurrentAutoMeal] = useState<MealType>(() => getCurrentMealType());
  const liveSelectedMeal = currentAutoMeal;
  // Filter within live session: all opted-in | pending/unserved | already served
  const [liveServingFilter, setLiveServingFilter] = useState<'all' | 'unserved' | 'served'>('all');

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr);
  const [records, setRecords] = useState<ResidentMealRecord[]>([]);
  const [summary, setSummary] = useState<DailyMealSummary>(() => ({
    date: getTodayStr(),
    totalResidents: 0,
    breakfastNeeded: 0,
    breakfastServed: 0,
    lunchNeeded: 0,
    lunchServed: 0,
    dinnerNeeded: 0,
    dinnerServed: 0,
  }));

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [servingLoading, setServingLoading] = useState<Record<string, boolean>>({});
  const [tableMissing, setTableMissing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(100);

  useEffect(() => {
    setVisibleLimit(100);
  }, [selectedDate, liveSelectedMeal, liveServingFilter]);

  const handleStepDate = (days: number) => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const cur = new Date(year, month, day);
      cur.setDate(cur.getDate() + days);
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${d}`);
    }
  };

  // Periodically keep real-time meal type updated
  useEffect(() => {
    const timer = setInterval(() => {
      const autoMeal = getCurrentMealType();
      setCurrentAutoMeal(autoMeal);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchMealData = useCallback(async (date: string) => {
    setLoading(true);
    setTableMissing(false);

    const res = await getAllResidentsMealAttendance(date);
    if (res.tableMissing) {
      setTableMissing(true);
      setLoading(false);
      return;
    }

    setRecords(res.records);
    setSummary(res.summary);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMealData(selectedDate);
  }, [selectedDate, fetchMealData]);

  // Handle toggling served status for a resident
  const handleToggleServed = async (record: ResidentMealRecord, mealType: MealType) => {
    const currentServed =
      mealType === 'breakfast'
        ? record.breakfast_served
        : mealType === 'lunch'
        ? record.lunch_served
        : record.dinner_served;

    const opKey = `${record.resident_id}-${mealType}`;
    setServingLoading((prev) => ({ ...prev, [opKey]: true }));

    // Optimistic UI update
    setRecords((prev) =>
      prev.map((r) => {
        if (r.resident_id === record.resident_id) {
          const updated = { ...r };
          if (mealType === 'breakfast') updated.breakfast_served = !currentServed;
          if (mealType === 'lunch') updated.lunch_served = !currentServed;
          if (mealType === 'dinner') updated.dinner_served = !currentServed;
          return updated;
        }
        return r;
      })
    );

    // Update summary counts optimistically
    setSummary((prev) => {
      const delta = !currentServed ? 1 : -1;
      return {
        ...prev,
        breakfastServed: mealType === 'breakfast' ? prev.breakfastServed + delta : prev.breakfastServed,
        lunchServed: mealType === 'lunch' ? prev.lunchServed + delta : prev.lunchServed,
        dinnerServed: mealType === 'dinner' ? prev.dinnerServed + delta : prev.dinnerServed,
      };
    });

    const res = await toggleMealServedStatus(
      record.resident_id,
      selectedDate,
      mealType,
      currentServed,
      {
        breakfast: record.breakfast,
        lunch: record.lunch,
        dinner: record.dinner,
        breakfast_served: record.breakfast_served,
        lunch_served: record.lunch_served,
        dinner_served: record.dinner_served,
      }
    );

    setServingLoading((prev) => ({ ...prev, [opKey]: false }));

    if (!res.success) {
      alert(`Could not update served status: ${res.error}`);
      fetchMealData(selectedDate);
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
ALTER TABLE public.meal_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access to meal_attendance" ON public.meal_attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read of meal_attendance" ON public.meal_attendance FOR SELECT TO anon USING (true);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Metrics for the active live session on Page 1 (Overview)
  const liveNeeded =
    liveSelectedMeal === 'breakfast'
      ? summary.breakfastNeeded
      : liveSelectedMeal === 'lunch'
      ? summary.lunchNeeded
      : summary.dinnerNeeded;

  const liveServed =
    liveSelectedMeal === 'breakfast'
      ? summary.breakfastServed
      : liveSelectedMeal === 'lunch'
      ? summary.lunchServed
      : summary.dinnerServed;

  const liveRemaining = Math.max(0, liveNeeded - liveServed);

  // Filter records for Page 1 (Only residents opted in for liveSelectedMeal)
  const liveRecords = records.filter((r) => {
    const optedIn =
      liveSelectedMeal === 'breakfast'
        ? r.breakfast
        : liveSelectedMeal === 'lunch'
        ? r.lunch
        : r.dinner;

    if (!optedIn) return false;

    const isServed =
      liveSelectedMeal === 'breakfast'
        ? r.breakfast_served
        : liveSelectedMeal === 'lunch'
        ? r.lunch_served
        : r.dinner_served;

    if (liveServingFilter === 'unserved' && isServed) return false;
    if (liveServingFilter === 'served' && !isServed) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    return (
      (r.name && r.name.toLowerCase().includes(query)) ||
      (r.room_no && r.room_no.toLowerCase().includes(query)) ||
      (r.mobile_no && r.mobile_no.includes(query)) ||
      (r.admission_no != null && String(r.admission_no).includes(query))
    );
  });

  const displayedRecords = liveRecords.slice(0, visibleLimit);

  const liveMealName =
    liveSelectedMeal === 'breakfast'
      ? 'Breakfast'
      : liveSelectedMeal === 'lunch'
      ? 'Lunch'
      : 'Dinner';

  const LiveMealIcon =
    liveSelectedMeal === 'breakfast'
      ? Coffee
      : liveSelectedMeal === 'lunch'
      ? Sun
      : Moon;

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      {/* Left-Side Navigation Sidebar (Only 2 pages: Live Service & Combined Data) */}
      <KitchenSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        currentMealType={currentAutoMeal}
        summary={summary}
        selectedDate={selectedDate}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile App Bar (Fixed/Sticky top header for mobile screens) */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-black/[0.06] px-4 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Harisree Mess</span>
              <h1 className="text-sm font-bold text-[#1d1d1f] leading-tight truncate">
                {activeView === 'overview' ? `${liveMealName} Attendance` : 'Staff Account'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => fetchMealData(selectedDate)}
              disabled={loading}
              title="Refresh Records"
              aria-label="Refresh records"
              className="w-8 h-8 rounded-xl bg-[#f5f5f7] hover:bg-[#ebebed] border border-black/[0.06] text-[#1d1d1f] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-[#6e6e73]'}`}
              />
            </button>
          </div>
        </header>

        {/* Top Header Bar for Desktop */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-xl border-b border-black/[0.08] px-4 sm:px-6 lg:px-8 items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {/* Left: Mobile hamburger menu & View Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition cursor-pointer shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="text-[11px] text-amber-800 font-semibold tracking-wider uppercase truncate">
                Kitchen
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-[#1d1d1f] leading-tight truncate">
                {activeView === 'overview' ? `${liveMealName} Service` : 'Staff Account'}
              </h1>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Refresh */}
            <button
              onClick={() => fetchMealData(selectedDate)}
              disabled={loading}
              title="Refresh Records"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-[#1d1d1f] bg-white hover:bg-[#f5f5f7] border border-black/[0.1] shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-[#86868b]'}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Kitchen Staff Email Badge */}
            <span className="hidden md:inline-block text-xs text-[#6e6e73] bg-[#f5f5f7] px-2.5 py-1 rounded-full border border-black/[0.06] font-mono">
              {user?.email}
            </span>

            {/* Quick Sign Out (Hidden on mobile) */}
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="hidden sm:inline-flex p-2 text-[#86868b] hover:text-[#ff3b30] hover:bg-rose-50 rounded-xl border border-black/[0.08] hover:border-rose-200 transition cursor-pointer"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        </header>

        {/* PWA Install Banner on mobile devices */}
        <PwaInstallPrompt />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 pb-28 lg:pb-8">
          {/* ========================================================================= */}
          {/* PAGE 3: ACCOUNT DETAILS */}
          {/* ========================================================================= */}
          {activeView === 'account' && <KitchenAccountView />}

          {/* Database setup notice if table is missing in Supabase */}
          {tableMissing && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-950">
                      Meal Attendance Table Setup Required
                    </h3>
                    <p className="text-xs text-amber-800/90 mt-1">
                      The <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">meal_attendance</code> table needs to be created in your Supabase project. We have prepared the SQL script.
                    </p>
                  </div>
                </div>
                <button
                  onClick={copySqlSnippet}
                  className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs transition cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                  <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PAGE 1: OVERVIEW (SHOW ONLY DETAILS FOR THAT TIME: BREAKFAST/LUNCH/DINNER) */}
          {/* ========================================================================= */}
          {activeView === 'overview' && (
            <>
              {/* Unified Live Meal Service & Metrics Card */}
              <div className="bg-white border border-black/[0.06] rounded-3xl p-4 sm:p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] space-y-4">
                {/* Row 1: Meal Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-600/10 border border-amber-500/25 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <LiveMealIcon className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-bold text-[#1d1d1f] tracking-tight leading-tight truncate">
                      {liveMealName} Service
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[#86868b] flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{getMealTimeWindow(liveSelectedMeal)}</span>
                    </p>
                  </div>
                </div>

                {/* Row 2: Dedicated Date Navigation Bar */}
                <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-[#f8f9fa] border border-black/[0.04]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepDate(-1)}
                      title="Previous Day"
                      aria-label="Previous Day"
                      className="p-1.5 sm:p-2 rounded-xl text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepDate(1)}
                      title="Next Day"
                      aria-label="Next Day"
                      className="p-1.5 sm:p-2 rounded-xl text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {selectedDate !== getTodayStr() && (
                      <button
                        type="button"
                        onClick={() => setSelectedDate(getTodayStr())}
                        title="Return to Today"
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        Today
                      </button>
                    )}
                    <KitchenDatePicker
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                    />
                  </div>
                </div>

                {/* Row 3: Tactile 3-Segment Meal Switcher */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#f0f0f2]">
                  {[
                    { id: 'breakfast' as MealType, label: 'Breakfast', icon: Coffee },
                    { id: 'lunch' as MealType, label: 'Lunch', icon: Sun },
                    { id: 'dinner' as MealType, label: 'Dinner', icon: Moon },
                  ].map((m) => {
                    const MIcon = m.icon;
                    const isSelected = currentAutoMeal === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setCurrentAutoMeal(m.id)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1c1c1e] text-white shadow-xs'
                            : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/50'
                        }`}
                      >
                        <MIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Row 4: 3 Focused Metric Cards */}
                <div className="pt-3 border-t border-black/[0.06] grid grid-cols-3 gap-2 sm:gap-3">
                    {/* 1. TO PREPARE */}
                    <div className="p-2.5 sm:p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-center flex flex-col justify-between">
                      <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Utensils className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>Prepare</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-[#1d1d1f] tracking-tight mt-0.5">
                        {liveNeeded}
                      </div>
                      <div className="text-[10px] text-[#86868b]">residents</div>
                    </div>

                    {/* 2. SERVED */}
                    <div className="p-2.5 sm:p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-center flex flex-col justify-between">
                      <div className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>Served</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-emerald-800 tracking-tight mt-0.5">
                        {liveServed}
                      </div>
                      <div className="text-[10px] text-[#86868b]">completed</div>
                    </div>

                    {/* 3. REMAINING */}
                    <div className="p-2.5 sm:p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/60 text-center flex flex-col justify-between">
                      <div className="text-[10px] font-bold text-orange-900 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Timer className="w-3 h-3 text-orange-700 shrink-0" />
                        <span>Remaining</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-bold text-orange-800 tracking-tight mt-0.5">
                        {liveRemaining}
                      </div>
                      <div className="text-[10px] text-[#86868b]">pending</div>
                    </div>
                  </div>
                </div>

              {/* Student Attendance Section */}
              <div className="space-y-3">
                {/* Section Controls (Filter Tabs & Search) */}
                <div className="bg-white border border-black/[0.06] rounded-3xl p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search student, room, admission no..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-9 py-2.5 bg-[#f5f5f7] border border-black/[0.08] focus:border-[#1c1c1e] focus:bg-white rounded-2xl text-xs text-[#1d1d1f] placeholder-[#86868b] outline-none transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] p-1 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Chips (All | Pending | Served) */}
                  <div className="grid grid-cols-3 gap-1 p-1 bg-[#efeff4] rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setLiveServingFilter('all')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center truncate ${
                        liveServingFilter === 'all'
                          ? 'bg-white text-[#1d1d1f] shadow-xs'
                          : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                      }`}
                    >
                      All ({liveNeeded})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveServingFilter('unserved')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center truncate ${
                        liveServingFilter === 'unserved'
                          ? 'bg-white text-orange-800 shadow-xs'
                          : 'text-[#6e6e73] hover:text-orange-800'
                      }`}
                    >
                      Pending ({liveRemaining})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveServingFilter('served')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer text-center truncate ${
                        liveServingFilter === 'served'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-[#6e6e73] hover:text-emerald-800'
                      }`}
                    >
                      Served ({liveServed})
                    </button>
                  </div>
                </div>

                {/* List / Table Body */}
                {loading ? (
                  <div className="bg-white border border-black/[0.06] rounded-3xl p-14 flex flex-col items-center justify-center text-[#86868b] space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
                    <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
                    <span className="text-xs font-medium">Loading {liveMealName.toLowerCase()} headcount...</span>
                  </div>
                ) : liveRecords.length === 0 ? (
                  <div className="bg-white border border-black/[0.06] rounded-3xl p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
                    <div className="w-14 h-14 rounded-3xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
                      <LiveMealIcon className="w-7 h-7 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-[#1d1d1f]">
                        {searchQuery ? 'No Matching Students' : `No Students Found for ${liveMealName}`}
                      </div>
                      <p className="text-xs text-[#86868b] mt-1 max-w-xs mx-auto">
                        {searchQuery
                          ? 'Try clearing your search query to see all students.'
                          : `No residents have opted in for ${liveMealName.toLowerCase()} on ${selectedDate}.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* MOBILE NATIVE CARDS VIEW (Visible on mobile/tablet) */}
                    <div className="lg:hidden space-y-2.5">
                      {displayedRecords.map((r) => {
                        const isServed =
                          liveSelectedMeal === 'breakfast'
                            ? r.breakfast_served
                            : liveSelectedMeal === 'lunch'
                            ? r.lunch_served
                            : r.dinner_served;

                        const opKey = `${r.resident_id}-${liveSelectedMeal}`;
                        const isUpdating = servingLoading[opKey];
                        const admDisplay = r.admission_no
                          ? String(r.admission_no).startsWith('#')
                            ? String(r.admission_no)
                            : `#${r.admission_no}`
                          : '#';

                        return (
                          <div
                            key={r.resident_id}
                            className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all duration-200 shadow-[0_1px_4px_rgba(0,0,0,0.03)] active:scale-[0.99]"
                          >
                            {/* Left: Admission Badge + Resident Details */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Admission Number Badge (Replacing Initial) */}
                              <div
                                title={`Admission ${admDisplay}`}
                                className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-950 border border-amber-200 shadow-2xs flex items-center justify-center font-mono font-bold text-xs shrink-0 px-1 select-none"
                              >
                                {admDisplay}
                              </div>

                              {/* Student Info */}
                              <div className="min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight leading-snug truncate">
                                  {r.name}
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6e6e73] flex-wrap">
                                  <span className="inline-flex items-center gap-1 font-mono font-semibold bg-[#f5f5f7] px-2 py-0.5 rounded-md border border-black/[0.06] text-[#1d1d1f]">
                                    <DoorOpen className="w-3 h-3 text-[#86868b]" />
                                    Room {r.room_no}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Big Touch Action Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleServed(r, liveSelectedMeal)}
                              disabled={isUpdating}
                              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs ${
                                isServed
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                              }`}
                              title={isServed ? 'Tap to mark unserved' : 'Tap to mark served'}
                            >
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isServed ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                  <span>Served</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                  <span>Serve</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* DESKTOP TABLE VIEW (Visible only on large screens) */}
                    <div className="hidden lg:block bg-white border border-black/[0.06] rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#fafafc] border-b border-black/[0.06] text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                            <th className="py-3.5 px-4 whitespace-nowrap text-left">Adm #</th>
                            <th className="py-3.5 px-4 whitespace-nowrap text-left">Student Name</th>
                            <th className="py-3.5 px-4 whitespace-nowrap text-center">Room</th>
                            <th className="py-3.5 px-4 whitespace-nowrap text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04] text-xs">
                          {displayedRecords.map((r) => {
                            const isServed =
                              liveSelectedMeal === 'breakfast'
                                ? r.breakfast_served
                                : liveSelectedMeal === 'lunch'
                                ? r.lunch_served
                                : r.dinner_served;

                            const opKey = `${r.resident_id}-${liveSelectedMeal}`;
                            const isUpdating = servingLoading[opKey];

                            return (
                              <tr key={r.resident_id} className="hover:bg-[#fbfbfd] transition">
                                <td className="py-3 px-4 font-mono font-semibold text-[#1d1d1f] whitespace-nowrap align-middle">
                                  #{r.admission_no}
                                </td>
                                <td className="py-3 px-4 font-medium text-[#1d1d1f] align-middle whitespace-nowrap">
                                  <div className="font-semibold">{r.name}</div>
                                </td>
                                <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 font-mono bg-[#f5f5f7] px-2.5 py-1 rounded-lg border border-black/[0.06] text-xs font-semibold text-[#1d1d1f]">
                                    <DoorOpen className="w-3.5 h-3.5 text-[#86868b]" />
                                    {r.room_no}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleServed(r, liveSelectedMeal)}
                                    disabled={isUpdating}
                                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95 shadow-xs ${
                                      isServed
                                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-amber-600 hover:bg-amber-700 text-white border border-amber-600 shadow-sm'
                                    }`}
                                    title={isServed ? 'Click to mark unserved' : 'Click to mark served'}
                                  >
                                    {isUpdating ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isServed ? (
                                      <>
                                        <Check className="w-4 h-4 text-emerald-600 font-bold" />
                                        <span>Served</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4 stroke-[2.5]" />
                                        <span>Serve</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Progressive loading controls when handling hundreds or 1,000+ residents */}
                    {liveRecords.length > visibleLimit && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-white border border-black/[0.06] rounded-2xl shadow-2xs">
                        <div className="text-xs text-[#86868b]">
                          Showing <span className="font-semibold text-[#1d1d1f]">{displayedRecords.length}</span> of <span className="font-semibold text-[#1d1d1f]">{liveRecords.length}</span> residents
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setVisibleLimit((prev) => prev + 100)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f5f5f7] hover:bg-[#ebebed] text-[#1d1d1f] border border-black/[0.08] transition active:scale-95 cursor-pointer shadow-2xs"
                          >
                            Load 100 More
                          </button>
                          <button
                            type="button"
                            onClick={() => setVisibleLimit(liveRecords.length)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition active:scale-95 cursor-pointer shadow-2xs"
                          >
                            Show All ({liveRecords.length})
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

        </main>
      </div>

      {/* Mobile Floating Bottom Navigation (Staff Mobile View) */}
      <StaffFloatingBottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        onRefresh={() => fetchMealData(selectedDate)}
      />
    </div>
  );
};
