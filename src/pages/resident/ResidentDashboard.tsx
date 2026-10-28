import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PwaInstallPrompt } from '../../components/PwaInstallPrompt';
import { ResidentSidebar, type ResidentTab } from '../../components/resident/ResidentSidebar';
import { ResidentFloatingBottomNav } from '../../components/resident/ResidentFloatingBottomNav';
import { ResidentAccountView } from '../../components/resident/ResidentAccountView';
import { MealPreferenceCard } from '../../components/resident/MealPreferenceCard';
import { MonthlyMealHeatmap } from '../../components/resident/MonthlyMealHeatmap';
import type { FeeTransaction } from '../../types/auth';
import {
  processAllMonthlyFees,
  fetchResidentFeeTransactions,
  formatReadableDate,
  clampDayOfMonth
} from '../../lib/fees';
import { getCurrentMealType } from '../../lib/meals';
import {
  Building2,
  CreditCard,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Utensils,
  RefreshCw,
  Info,
  Menu,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Coffee,
  Sun,
  Moon,
  Receipt
} from 'lucide-react';

export const ResidentDashboard: React.FC = () => {
  const { user, residentProfile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state synced with URL search params
  const currentTabParam = searchParams.get('tab') as ResidentTab | null;
  const initialTab: ResidentTab =
    currentTabParam && ['overview', 'meals', 'fees', 'account'].includes(currentTabParam)
      ? currentTabParam
      : 'overview';

  const [activeTab, setActiveTabState] = useState<ResidentTab>(initialTab);

  const setActiveTab = (tab: ResidentTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  };

  const [refreshing, setRefreshing] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('harisree_resident_sidebar_collapsed') === 'true';
  });

  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  

  // Live real-time meal type
  const liveMealType = getCurrentMealType();

  // Automatically check and process monthly fees on mount
  useEffect(() => {
    processAllMonthlyFees().then(() => {
      refreshProfile();
    });
  }, [refreshProfile]);

  // Fetch transaction history when on fees tab
  useEffect(() => {
    if (residentProfile?.id && activeTab === 'fees') {
      setLoadingTransactions(true);
      fetchResidentFeeTransactions(residentProfile.id).then(({ data }) => {
        setTransactions(data);
        setLoadingTransactions(false);
      });
    }
  }, [residentProfile?.id, activeTab]);

  const handleToggleCollapse = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsed((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      localStorage.setItem('harisree_resident_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await processAllMonthlyFees();
    await refreshProfile();
    if (residentProfile?.id) {
      const { data } = await fetchResidentFeeTransactions(residentProfile.id);
      setTransactions(data);
    }
    setRefreshing(false);
  };

  if (!residentProfile) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-black/[0.08] rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mx-auto mb-4">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 tracking-tight">Resident Profile Loading</h2>
          <p className="text-xs text-[#86868b] mb-6 leading-relaxed">
            Retrieving hostel records for <strong className="text-[#1d1d1f]">{user?.email}</strong>.
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#011627] hover:bg-[#0b253a] text-white transition shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Profile</span>
          </button>
        </div>
      </div>
    );
  }

  const {
    admission_no,
    name,
    monthly_fee,
    caution_deposit,
    pending,
    next_fee_payment_date,
    fee_due_day,
  } = residentProfile;

  const fixedDay = fee_due_day || (next_fee_payment_date ? parseInt(next_fee_payment_date.split('-')[2], 10) : 5);

  const getEffectiveNextFeePaymentDate = (
    nextDate?: string | null,
    dueDay?: number | null
  ): string => {
    if (nextDate && nextDate.trim() !== '') return nextDate;
    const now = new Date();
    const targetDay = dueDay && dueDay >= 1 && dueDay <= 31 ? dueDay : 5;
    const year = now.getFullYear();
    const month = now.getMonth();
    if (now.getDate() <= targetDay) {
      return clampDayOfMonth(year, month, targetDay);
    }
    return clampDayOfMonth(year, month + 1, targetDay);
  };

  const effectiveNextPaymentDate = getEffectiveNextFeePaymentDate(next_fee_payment_date, fixedDay);
  const pendingAmount = Number(pending || 0);

  // Dynamic mobile header page title
  const getMobilePageName = () => {
    switch (activeTab) {
      case 'meals':
        return 'Meals';
      case 'fees':
        return 'Fees';
      case 'account':
        return 'Account';
      case 'overview':
      default:
        return 'Overview';
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex print:bg-white print:text-black">
      <PwaInstallPrompt />

      {/* Left Navigation Sidebar (Desktop & Tablet Drawer) */}
      <div className="print:hidden">
        <ResidentSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          residentName={name}
          admissionNo={admission_no}
          pendingBalance={Number(pending || 0)}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={handleToggleCollapse}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#f5f5f7] print:bg-white">
        {/* Top Header Bar - Desktop only (hidden on mobile) */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-xl border-b border-black/[0.08] px-4 sm:px-6 lg:px-8 items-center justify-between print:hidden">
          {/* Left: Desktop View Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition cursor-pointer shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-[#011627] font-semibold tracking-wider uppercase truncate">
                <span>Resident Portal</span>
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-[#1d1d1f] leading-tight truncate">
                {name || 'Resident'}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh Details"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-[#515154] hover:text-[#1d1d1f] bg-white hover:bg-[#f5f5f7] border border-black/[0.08] shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#011627]' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* NATIVE MOBILE APP TOP BAR (Sticky across all resident tabs) */}
        <div className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-black/[0.06] flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] print:hidden select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#011627] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-[#1d1d1f] tracking-tight leading-none">
                  Harisree Hostel
                </h1>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#011627]/[0.08] text-[#011627] uppercase">
                  Resident
                </span>
              </div>
              <p className="text-[11px] text-[#86868b] mt-0.5 font-medium">
                {getMobilePageName()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh data"
            className="w-9 h-9 rounded-full bg-[#f5f5f7] hover:bg-[#ebebed] text-[#1d1d1f] flex items-center justify-center active:scale-95 transition cursor-pointer border border-black/[0.04]"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#011627]' : 'text-[#6e6e73]'}`}
            />
          </button>
        </div>

        {/* Main Content Body with ample bottom clearance for floating navigation bar */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6 pb-28 lg:pb-8">

          {/* TAB 1: OVERVIEW */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-3.5 sm:space-y-6 print:hidden">

              

              {/* Mobile Hero Financial Pass (Apple Wallet / Fintech aesthetic) */}
              <div
                onClick={() => setActiveTab('fees')}
                role="button"
                tabIndex={0}
                className="lg:hidden relative overflow-hidden rounded-3xl p-5 bg-[#011627] text-white shadow-md active:scale-[0.99] transition cursor-pointer select-none space-y-4"
              >
                {/* Header: Title + Status Pill */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5 text-blue-300" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 tracking-tight">
                      Hostel Fee & Dues
                    </span>
                  </div>

                  {pendingAmount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Payment Due</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>All Cleared</span>
                    </span>
                  )}
                </div>

                {/* Main Hero Amount */}
                <div className="py-1">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                    {pendingAmount > 0 ? 'Total Outstanding Amount' : 'Current Outstanding Balance'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold font-mono tracking-tight text-white">
                      ₹{pendingAmount.toLocaleString('en-IN')}
                    </span>
                    {pendingAmount > 0 && (
                      <span className="text-xs text-amber-300/90 font-medium">
                        due by {formatReadableDate(effectiveNextPaymentDate)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: 2 Clean Chips + Ledger Action */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Monthly Fee</span>
                      <span className="font-semibold text-emerald-300 font-mono text-xs">
                        ₹{Number(monthly_fee || 0).toLocaleString()}
                        <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Deposit</span>
                      <span className="font-semibold text-slate-200 font-mono text-xs">
                        ₹{Number(caution_deposit || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition">
                    <span>View Ledger</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Desktop-only 2-Widget Grid (hidden on mobile, shown on lg) */}
              <div className="hidden lg:grid grid-cols-2 gap-4 lg:gap-6">
                <div
                  onClick={() => setActiveTab('fees')}
                  role="button"
                  tabIndex={0}
                  title="Click to view detailed Fee Ledger"
                  className="p-5 lg:p-6 rounded-3xl bg-gradient-to-br from-white via-white to-[#f4f7fc] border border-black/[0.08] shadow-sm hover:shadow-md hover:border-[#011627]/30 transition-all flex flex-col justify-between cursor-pointer group select-none min-h-[168px]"
                >
                  <div>
                    <div className="h-7 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-[#86868b] truncate shrink-0">
                        Next Due
                      </span>
                    </div>

                    <div className="my-3 h-8 flex items-center">
                      <span className="text-xl lg:text-2xl font-bold text-[#1d1d1f] tracking-tight block truncate">
                        {formatReadableDate(effectiveNextPaymentDate)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between min-h-[28px]">
                    <div className="text-xs text-[#86868b] flex items-center gap-1 truncate">
                      <span>Fee:</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        ₹{Number(monthly_fee || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-[#86868b]">/mo</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#86868b] group-hover:text-[#011627] group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('fees')}
                  role="button"
                  tabIndex={0}
                  title="Click to view detailed Fee Ledger"
                  className={`p-5 lg:p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group select-none min-h-[168px] ${
                    pendingAmount > 0
                      ? 'bg-gradient-to-br from-white via-white to-amber-50/50 border-amber-200/90 hover:border-amber-300'
                      : 'bg-gradient-to-br from-white via-white to-emerald-50/40 border-emerald-200/90 hover:border-emerald-300'
                  }`}
                >
                  <div>
                    <div className="h-7 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-[#86868b] truncate shrink-0">
                        Pending
                      </span>

                      {pendingAmount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Due</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Paid</span>
                        </span>
                      )}
                    </div>

                    <div className="my-3 h-8 flex items-center">
                      <span
                        className={`text-xl lg:text-2xl font-bold tracking-tight block truncate ${
                          pendingAmount > 0 ? 'text-amber-600' : 'text-[#1d1d1f]'
                        }`}
                      >
                        ₹{pendingAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between min-h-[28px]">
                    <div className="text-xs font-medium truncate flex items-center">
                      <span className={pendingAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                        {pendingAmount > 0 ? 'Payment Required' : 'Zero balance due'}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-all shrink-0 ml-1 group-hover:translate-x-0.5 ${
                        pendingAmount > 0
                          ? 'text-amber-600 group-hover:text-amber-700'
                          : 'text-emerald-600 group-hover:text-emerald-700'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Food Selection Card */}
              <div>
                <MealPreferenceCard
                  residentId={residentProfile.id}
                  mealsPerDay={residentProfile.meals_per_day}
                />
              </div>

              

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: MEALS */}
          {/* ============================================================ */}
          {activeTab === 'meals' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <MonthlyMealHeatmap residentId={residentProfile.id} mealsPerDay={residentProfile.meals_per_day} />

              {/* Mess & Dining Schedule Card */}
              <div className="p-4 sm:p-6 rounded-3xl bg-white border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f]">
                      Mess & Dining Schedule
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-[#86868b] bg-[#f2f2f7] px-2.5 py-1 rounded-full">
                    Ground Floor
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                    liveMealType === 'breakfast'
                      ? 'bg-amber-50/70 border-amber-300 shadow-2xs font-semibold'
                      : 'bg-[#fafafc] border-black/[0.04]'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Coffee className={`w-4 h-4 ${liveMealType === 'breakfast' ? 'text-amber-600' : 'text-[#86868b]'}`} />
                      <span className="text-[#1d1d1f]">Breakfast</span>
                      {liveMealType === 'breakfast' && (
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                          Now
                        </span>
                      )}
                    </div>
                    <span className="text-[#515154] font-mono font-semibold">07:30 AM - 09:00 AM</span>
                  </div>

                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                    liveMealType === 'lunch'
                      ? 'bg-orange-50/70 border-orange-300 shadow-2xs font-semibold'
                      : 'bg-[#fafafc] border-black/[0.04]'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Sun className={`w-4 h-4 ${liveMealType === 'lunch' ? 'text-orange-600' : 'text-[#86868b]'}`} />
                      <span className="text-[#1d1d1f]">Lunch</span>
                      {liveMealType === 'lunch' && (
                        <span className="text-[9px] font-bold text-orange-800 bg-orange-100 px-1.5 py-0.5 rounded">
                          Now
                        </span>
                      )}
                    </div>
                    <span className="text-[#515154] font-mono font-semibold">12:30 PM - 02:00 PM</span>
                  </div>

                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                    liveMealType === 'dinner'
                      ? 'bg-blue-50/70 border-blue-300 shadow-2xs font-semibold'
                      : 'bg-[#fafafc] border-black/[0.04]'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <Moon className={`w-4 h-4 ${liveMealType === 'dinner' ? 'text-blue-600' : 'text-[#86868b]'}`} />
                      <span className="text-[#1d1d1f]">Dinner</span>
                      {liveMealType === 'dinner' && (
                        <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                          Now
                        </span>
                      )}
                    </div>
                    <span className="text-[#515154] font-mono font-semibold">07:30 PM - 09:00 PM</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-[11px] flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Food should be collected at the <strong>correct scheduled time</strong>.</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: FEES & DUES */}
          {/* ============================================================ */}
          {activeTab === 'fees' && (
            <div className="space-y-4 max-w-xl mx-auto">

              {/* 1. MOBILE HERO FINTECH CARD */}
              <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#011627] via-[#092945] to-[#011627] text-white shadow-lg space-y-4 select-none">
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-300">
                      <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                      <span>Hostel Fee Account</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-slate-200">
                      Adm #{admission_no}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-300 font-medium block">
                      Total Outstanding Balance
                    </span>
                    <div className="text-3xl font-bold font-mono tracking-tight text-white mt-0.5">
                      ₹{pendingAmount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    {pendingAmount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Payment Required • Due {formatReadableDate(effectiveNextPaymentDate)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>All Dues Cleared in Full</span>
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Monthly Rent</span>
                      <span className="font-semibold text-emerald-300 font-mono text-sm">
                        ₹{Number(monthly_fee || 0).toLocaleString()}
                        <span className="text-[10px] font-normal text-slate-400">/mo</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Caution Deposit</span>
                      <span className="font-semibold text-white font-mono text-sm">
                        ₹{Number(caution_deposit || 0).toLocaleString()}
                        <span className="text-[10px] font-normal text-slate-400"> (Ref)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. TRANSACTION HISTORY */}
              <div className="p-4 sm:p-6 rounded-3xl bg-white border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#011627]" />
                    <h3 className="text-sm sm:text-base font-bold text-[#1d1d1f]">
                      Payment & Billing History
                    </h3>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-1.5 rounded-lg text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition cursor-pointer"
                    title="Refresh Transactions"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#011627]' : ''}`} />
                  </button>
                </div>

                {loadingTransactions ? (
                  <div className="py-8 flex flex-col items-center justify-center text-[#86868b] text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#011627] mb-2" />
                    <span>Loading payment ledger...</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#86868b] space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#f2f2f7] flex items-center justify-center mx-auto text-[#86868b]">
                      <Receipt className="w-6 h-6 opacity-60" />
                    </div>
                    <p className="font-semibold text-[#1d1d1f]">No transactions recorded yet</p>
                    <p className="text-[11px] text-[#86868b] max-w-xs mx-auto">
                      Your monthly hostel fees and recorded payment receipts will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile cards view */}
                    <div className="sm:hidden space-y-2.5">
                      {transactions.map((tx) => {
                        const isPayment = tx.type === 'PAYMENT';
                        const isFee = tx.type === 'MONTHLY_FEE';
                        return (
                          <div
                            key={tx.id || `${tx.created_at}-${tx.amount}`}
                            className="p-3.5 rounded-2xl bg-[#fafafc] border border-black/[0.05] space-y-2 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isPayment
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-[#011627]/10 text-[#011627]'
                                  }`}
                                >
                                  {isPayment ? (
                                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <TrendingUp className="w-4 h-4 text-[#011627]" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-[#1d1d1f] truncate">
                                    {isPayment
                                      ? 'Payment Received'
                                      : isFee
                                      ? 'Monthly Fee Added'
                                      : 'Opening Balance'}
                                  </div>
                                  <div className="text-[10px] text-[#86868b] font-mono">
                                    {formatReadableDate(tx.billing_date || tx.created_at)}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`text-right font-mono font-bold text-sm shrink-0 ${
                                  isPayment ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {isPayment ? '-' : '+'}₹{Number(tx.amount || 0).toLocaleString()}
                              </div>
                            </div>
                            <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#86868b]">
                              <span className="truncate pr-2">
                                {tx.description || (isPayment ? 'Fee payment' : 'Hostel monthly fee')}
                              </span>
                              <span className="font-mono font-medium text-[#1d1d1f] shrink-0">
                                Bal: ₹{Number(tx.balance_after || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop table view */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#f5f5f7] text-[#86868b] uppercase text-[10px] font-semibold">
                          <tr>
                            <th className="px-3.5 py-2.5 rounded-l-xl">Date</th>
                            <th className="px-3.5 py-2.5">Type</th>
                            <th className="px-3.5 py-2.5">Details</th>
                            <th className="px-3.5 py-2.5 text-right">Amount</th>
                            <th className="px-3.5 py-2.5 rounded-r-xl text-right">Balance After</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/[0.04]">
                          {transactions.map((tx) => {
                            const isPayment = tx.type === 'PAYMENT';
                            const isFee = tx.type === 'MONTHLY_FEE';
                            return (
                              <tr key={tx.id || `${tx.created_at}-${tx.amount}`} className="hover:bg-[#fafafc] transition">
                                <td className="px-3.5 py-3 whitespace-nowrap text-[#515154] font-mono">
                                  {formatReadableDate(tx.billing_date || tx.created_at)}
                                </td>
                                <td className="px-3.5 py-3 whitespace-nowrap">
                                  {isPayment ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <TrendingDown className="w-3 h-3" />
                                      Payment Received
                                    </span>
                                  ) : isFee ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#011627]/10 text-[#011627] border border-[#011627]/20">
                                      <TrendingUp className="w-3 h-3" />
                                      Monthly Fee Added
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                      Opening Balance
                                    </span>
                                  )}
                                </td>
                                <td className="px-3.5 py-3">
                                  <div className="font-medium text-[#1d1d1f]">{tx.description}</div>
                                  {tx.receipt_no && (
                                    <div className="text-[10px] text-[#86868b] font-mono mt-0.5">
                                      Receipt: #{tx.receipt_no} {tx.payment_method ? `• ${tx.payment_method}` : ''}
                                    </div>
                                  )}
                                </td>
                                <td
                                  className={`px-3.5 py-3 text-right font-mono font-semibold whitespace-nowrap ${
                                    isPayment ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {isPayment ? '-' : '+'}₹{Number(tx.amount || 0).toLocaleString()}
                                </td>
                                <td className="px-3.5 py-3 text-right font-mono font-semibold text-[#1d1d1f] whitespace-nowrap">
                                  ₹{Number(tx.balance_after || 0).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: ACCOUNT */}
          {/* ============================================================ */}
          {activeTab === 'account' && (
            <ResidentAccountView
              residentProfile={residentProfile}
              onRefresh={handleRefresh}
              refreshing={refreshing}
            />
          )}

        </main>
      </div>

      {/* Floating Bottom Navigation (Icon-only, Apple pill style) */}
      <ResidentFloatingBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
      />

      </div>
  );
};
