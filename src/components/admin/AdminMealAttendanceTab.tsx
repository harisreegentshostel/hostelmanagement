import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils,
  Search,
  CheckCircle2,
  Clock,
  X,
  Coffee,
  Sun,
  Moon,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Bed,
  Building2
} from 'lucide-react';
import {
  getAllResidentsMealAttendance,
  getTodayStr,
  getCurrentMealType
} from '../../lib/meals';
import type { ResidentMealRecord, DailyMealSummary } from '../../types/meals';
import { Pagination } from './Pagination';

export const AdminMealAttendanceTab: React.FC = () => {
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
  const [mealFilter, setMealFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all');
  const [tableMissing, setTableMissing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const currentMeal = getCurrentMealType();
  const isToday = selectedDate === getTodayStr();

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

  const filteredRecords = records.filter((r) => {
    if (mealFilter === 'breakfast') {
      if (!r.breakfast) return false;
    } else if (mealFilter === 'lunch') {
      if (!r.lunch) return false;
    } else if (mealFilter === 'dinner') {
      if (!r.dinner) return false;
    } else {
      if (!r.breakfast && !r.lunch && !r.dinner) return false;
    }

    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.room_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mobile_no.includes(searchQuery) ||
      String(r.admission_no).includes(searchQuery);

    return matchesSearch;
  });

  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * PAGE_SIZE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepDate = (days: number) => {
    const parts = selectedDate.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      setSelectedDate(`${y}-${m}-${dateNum}`);
      setCurrentPage(1);
    }
  };

  const renderMealStatusIcon = (optedIn: boolean, served: boolean) => {
    if (!optedIn) {
      return (
        <span
          title="Opted Out"
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#f5f5f7] text-[#86868b] border border-black/[0.08]"
        >
          <X className="w-3.5 h-3.5" />
        </span>
      );
    }

    if (served) {
      return (
        <span
          title="Received"
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </span>
      );
    }

    return (
      <span
        title="Food Needed (Pending)"
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
      >
        <Clock className="w-4 h-4 text-amber-600" />
      </span>
    );
  };

  return (
    <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0 space-y-4 pb-6">
      {/* 1. NATIVE MOBILE APP TOP BAR WITH DATE STEPPER */}
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
              Daily Mess
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => fetchMealData(selectedDate)}
          disabled={loading}
          title="Refresh records"
          className="w-9 h-9 rounded-full bg-[#f5f5f7] hover:bg-[#ebebed] text-[#1d1d1f] flex items-center justify-center active:scale-95 transition cursor-pointer border border-black/[0.04]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#011627]' : 'text-[#6e6e73]'}`} />
        </button>
      </div>

      <div className="px-4 sm:px-0 space-y-4">
        {/* 2. TODAY'S FOOD HERO CARDS WIDGET (3 SESSIONS) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              Service Summary • {isToday ? 'Today' : selectedDate}
            </span>
          </div>

          {/* 3 Meal Session Tiles */}
          <div className="grid grid-cols-3 gap-2">
            {/* Breakfast */}
            <div
              className={`p-3 rounded-2xl border text-center transition ${
                isToday && currentMeal === 'breakfast'
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300/40'
                  : 'bg-[#fbfbfd] border-black/[0.04]'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-800 mb-0.5">
                <Coffee className="w-3.5 h-3.5" />
                <span>Breakfast</span>
              </div>
              <div className="text-xl font-bold font-mono text-[#1d1d1f] mt-1">
                {summary.breakfastServed}
                <span className="text-xs font-normal text-[#86868b]">/{summary.breakfastNeeded}</span>
              </div>
              <span className="text-[9px] text-[#86868b] block mt-0.5 font-medium">
                {summary.breakfastNeeded - summary.breakfastServed} left
              </span>
            </div>

            {/* Lunch */}
            <div
              className={`p-3 rounded-2xl border text-center transition ${
                isToday && currentMeal === 'lunch'
                  ? 'bg-orange-50/70 border-orange-300 ring-1 ring-orange-300/40'
                  : 'bg-[#fbfbfd] border-black/[0.04]'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-orange-800 mb-0.5">
                <Sun className="w-3.5 h-3.5" />
                <span>Lunch</span>
              </div>
              <div className="text-xl font-bold font-mono text-[#1d1d1f] mt-1">
                {summary.lunchServed}
                <span className="text-xs font-normal text-[#86868b]">/{summary.lunchNeeded}</span>
              </div>
              <span className="text-[9px] text-[#86868b] block mt-0.5 font-medium">
                {summary.lunchNeeded - summary.lunchServed} left
              </span>
            </div>

            {/* Dinner */}
            <div
              className={`p-3 rounded-2xl border text-center transition ${
                isToday && currentMeal === 'dinner'
                  ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-300/40'
                  : 'bg-[#fbfbfd] border-black/[0.04]'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-900 mb-0.5">
                <Moon className="w-3.5 h-3.5" />
                <span>Dinner</span>
              </div>
              <div className="text-xl font-bold font-mono text-[#1d1d1f] mt-1">
                {summary.dinnerServed}
                <span className="text-xs font-normal text-[#86868b]">/{summary.dinnerNeeded}</span>
              </div>
              <span className="text-[9px] text-[#86868b] block mt-0.5 font-medium">
                {summary.dinnerNeeded - summary.dinnerServed} left
              </span>
            </div>
          </div>

          {/* Date Stepper Controls */}
          <div className="pt-1 flex items-center justify-between bg-[#f5f5f7] border border-black/[0.05] rounded-2xl p-1">
            <button
              type="button"
              onClick={() => handleStepDate(-1)}
              title="Previous Day"
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white shadow-2xs hover:bg-[#ebebed] text-[#1d1d1f] active:scale-95 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative px-3 py-1 text-xs font-semibold text-[#1d1d1f] font-mono cursor-pointer flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#011627]" />
              <span>{isToday ? 'Today' : selectedDate}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
            </div>

            <button
              type="button"
              onClick={() => handleStepDate(1)}
              title="Next Day"
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white shadow-2xs hover:bg-[#ebebed] text-[#1d1d1f] active:scale-95 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Database Notice if table missing */}
        {tableMissing && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <strong>Supabase Setup Required</strong>: <code className="bg-amber-100 px-1 py-0.5 rounded">meal_attendance</code> table is missing.
              </div>
            </div>
            <button
              onClick={copySqlSnippet}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-amber-900 border border-amber-300 shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-amber-700" />}
              <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Script'}</span>
            </button>
          </div>
        )}

        {/* 3. FILTER PILLS & SEARCH (MOBILE NATIVE SEGMENTED CONTROL) */}
        <div className="space-y-2.5">
          {/* Segmented Control */}
          <div className="grid grid-cols-4 gap-1.5 bg-[#efeff4] p-1.5 rounded-2xl text-xs">
            <button
              type="button"
              onClick={() => {
                setMealFilter('all');
                setCurrentPage(1);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center truncate ${
                mealFilter === 'all'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setMealFilter('breakfast');
                setCurrentPage(1);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center truncate ${
                mealFilter === 'breakfast'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-[#6e6e73] hover:text-amber-800'
              }`}
            >
              Breakfast
            </button>
            <button
              type="button"
              onClick={() => {
                setMealFilter('lunch');
                setCurrentPage(1);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center truncate ${
                mealFilter === 'lunch'
                  ? 'bg-white text-orange-800 shadow-xs'
                  : 'text-[#6e6e73] hover:text-orange-800'
              }`}
            >
              Lunch
            </button>
            <button
              type="button"
              onClick={() => {
                setMealFilter('dinner');
                setCurrentPage(1);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center truncate ${
                mealFilter === 'dinner'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-[#6e6e73] hover:text-indigo-900'
              }`}
            >
              Dinner
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none" />
            <input
              type="text"
              placeholder="Search resident by name or room..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-[50px] pl-11 pr-10 bg-white border border-black/[0.08] focus:border-[#011627] rounded-2xl text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none transition shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 4. RESIDENT MEAL LIST: NATIVE MOBILE CARDS (sm:hidden) & DESKTOP TABLE (hidden sm:block) */}
        {loading ? (
          <div className="p-12 text-center text-[#86868b] flex flex-col items-center justify-center bg-white rounded-3xl border border-black/[0.06]">
            <Loader2 className="w-7 h-7 animate-spin text-amber-600 mb-2" />
            <span className="text-xs">Loading food records...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-[#86868b] text-xs bg-white rounded-3xl border border-black/[0.06] flex flex-col items-center justify-center">
            <Utensils className="w-8 h-8 text-[#86868b]/40 mb-2" />
            <span className="font-semibold text-[#1d1d1f] text-sm">No Food Requests Found</span>
            <span className="text-[11px] text-[#86868b] mt-0.5">
              No students opted in matching your selected filter.
            </span>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: NATIVE STUDENT MEAL CARDS (Not a desktop table!) */}
            <div className="sm:hidden space-y-2.5">
              {paginatedRecords.map((r) => (
                <div
                  key={r.resident_id}
                  className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-2xs space-y-2.5"
                >
                  {/* Top line: Adm #, Student Name, Room & Bed */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80 shrink-0">
                        #{r.admission_no}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-[#1d1d1f] truncate block">
                          {r.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#86868b] mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <DoorOpen className="w-3 h-3 text-[#011627]" />
                            Room {r.room_no}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Bed className="w-3 h-3 text-violet-600" />
                            Bed {r.bed_no}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                      {r.meals_per_day || 3} meals/day
                    </span>
                  </div>

                  {/* 3 Large Touch-Friendly Meal Badges */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-black/[0.04]">
                    {/* Breakfast */}
                    <div className="text-center p-1.5 rounded-xl bg-[#f8f9fa] border border-black/[0.04]">
                      <span className="text-[9px] uppercase font-bold text-[#86868b] block">Breakfast</span>
                      <div className="mt-1 flex items-center justify-center">
                        {r.breakfast ? (
                          r.breakfast_served ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Needed
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-[#86868b] font-medium">—</span>
                        )}
                      </div>
                    </div>

                    {/* Lunch */}
                    <div className="text-center p-1.5 rounded-xl bg-[#f8f9fa] border border-black/[0.04]">
                      <span className="text-[9px] uppercase font-bold text-[#86868b] block">Lunch</span>
                      <div className="mt-1 flex items-center justify-center">
                        {r.lunch ? (
                          r.lunch_served ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-orange-50 text-orange-800 border border-orange-200 animate-pulse">
                              <Clock className="w-3 h-3 text-orange-600" />
                              Needed
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-[#86868b] font-medium">—</span>
                        )}
                      </div>
                    </div>

                    {/* Dinner */}
                    <div className="text-center p-1.5 rounded-xl bg-[#f8f9fa] border border-black/[0.04]">
                      <span className="text-[9px] uppercase font-bold text-[#86868b] block">Dinner</span>
                      <div className="mt-1 flex items-center justify-center">
                        {r.dinner ? (
                          r.dinner_served ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 animate-pulse">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              Needed
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-[#86868b] font-medium">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP VIEW: CLEAN TABLE */}
            <div className="hidden sm:block bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-[#1d1d1f]">
                <thead className="bg-[#fafafc] border-b border-black/[0.06] text-[#86868b] uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-5 py-3 w-16">Adm #</th>
                    <th className="px-5 py-3">Resident</th>
                    <th className="px-4 py-3 text-center w-24">Meals</th>
                    <th className="px-4 py-3 text-center w-28">Breakfast</th>
                    <th className="px-4 py-3 text-center w-28">Lunch</th>
                    <th className="px-4 py-3 text-center w-28">Dinner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {paginatedRecords.map((r) => (
                    <tr key={r.resident_id} className="hover:bg-[#f5f5f7]/60 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-800">
                        #{r.admission_no}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-[#1d1d1f] block">{r.name}</span>
                        <span className="text-[11px] text-[#86868b]">
                          Room {r.room_no} • Bed {r.bed_no}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold text-xs">
                          {r.meals_per_day || 3}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {renderMealStatusIcon(r.breakfast, r.breakfast_served)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {renderMealStatusIcon(r.lunch, r.lunch_served)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {renderMealStatusIcon(r.dinner, r.dinner_served)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <Pagination
              currentPage={validPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              itemName="residents"
            />
          </>
        )}
      </div>
    </div>
  );
};
