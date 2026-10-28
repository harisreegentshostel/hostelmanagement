import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AdminSidebar, type AdminTab } from '../../components/admin/AdminSidebar';
import { AdminFloatingBottomNav } from '../../components/admin/AdminFloatingBottomNav';
import { AdminDuesView } from '../../components/admin/AdminDuesView';
import { AdminMealAttendanceTab } from '../../components/admin/AdminMealAttendanceTab';
import { AdminAccountView } from '../../components/admin/AdminAccountView';
import { AdminOverviewView } from '../../components/admin/AdminOverviewView';
import { AdminResidentsView } from '../../components/admin/AdminResidentsView';
import { AddResidentModal } from './AddResidentModal';
import { RecordPaymentModal } from '../../components/admin/RecordPaymentModal';
import { FeeHistoryModal } from '../../components/admin/FeeHistoryModal';
import { ResidentDetailsModal } from '../../components/admin/ResidentDetailsModal';
import { PwaInstallPrompt } from '../../components/PwaInstallPrompt';
import { supabase } from '../../lib/supabase';
import { sendResidentMagicLink } from '../../lib/residentAuth';
import { processAllMonthlyFees } from '../../lib/fees';
import type { ResidentRecord } from '../../types/auth';
import { UserPlus, RefreshCw } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state synced with URL search params
  const currentTabParam = searchParams.get('tab') as AdminTab | null;
  const initialTab: AdminTab =
    currentTabParam && ['overview', 'residents', 'meals', 'dues', 'account'].includes(currentTabParam)
      ? currentTabParam
      : 'overview';

  const [activeTab, setActiveTabState] = useState<AdminTab>(initialTab);

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Sidebar responsive state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('harisree_admin_sidebar_collapsed') === 'true';
  });

  const handleToggleCollapse = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsed((prev) => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      localStorage.setItem('harisree_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Data state
  const [residents, setResidents] = useState<ResidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableMissing, setTableMissing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaymentResident, setSelectedPaymentResident] = useState<ResidentRecord | null>(null);
  const [selectedHistoryResident, setSelectedHistoryResident] = useState<ResidentRecord | null>(null);
  const [selectedResidentDetails, setSelectedResidentDetails] = useState<ResidentRecord | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [sendingLink, setSendingLink] = useState<Record<string, boolean>>({});
  const [linkSentSuccess, setLinkSentSuccess] = useState<Record<string, boolean>>({});
  const [monthlyPayments, setMonthlyPayments] = useState<number>(0);

  const fetchResidents = async () => {
    setLoading(true);
    setTableMissing(false);
    try {
      // 1. Automatically calculate and accumulate monthly fees due on fixed dates
      await processAllMonthlyFees();

      // 2. Fetch up-to-date residents
      const { data, error } = await supabase
        .from('residents')
        .select('*')
        .order('admission_no', { ascending: true });

      if (error) {
        if (
          error.message.includes('relation "public.residents" does not exist') ||
          error.code === '42P01'
        ) {
          setTableMissing(true);
        } else {
          console.error('Error fetching residents:', error.message);
        }
        setResidents([]);
      } else {
        setResidents((data as ResidentRecord[]) || []);
      }

      // 3. Fetch payments made during current month from fee_transactions
      const now = new Date();
      const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
      const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)).toISOString();

      try {
        const { data: txData } = await supabase
          .from('fee_transactions')
          .select('amount, created_at')
          .eq('type', 'PAYMENT')
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (txData && txData.length > 0) {
          const totalPaid = txData.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          setMonthlyPayments(totalPaid);
        } else {
          setMonthlyPayments(0);
        }
      } catch {
        setMonthlyPayments(0);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const handleUpdateMealPlan = async (residentId: string, newMealsPerDay: number) => {
    try {
      const { error } = await supabase
        .from('residents')
        .update({ meals_per_day: newMealsPerDay })
        .eq('id', residentId);

      if (!error) {
        setResidents((prev) =>
          prev.map((r) => (r.id === residentId ? { ...r, meals_per_day: newMealsPerDay } : r))
        );
      }
    } catch (err) {
      console.warn('Failed to update resident meal plan:', err);
    }
  };

  // Calculated Metrics
  const residentCount = residents.length;
  const totalPendingDues = residents.reduce((sum, r) => sum + Number(r.pending || 0), 0);
  const pendingCount = residents.filter((r) => Number(r.pending) > 0).length;
  const totalMonthlyRent = residents.reduce((sum, r) => sum + Number(r.monthly_fee || 0), 0);

  // Collected this month: accounts for direct payment ledger transactions as well as monthly fee balance
  const calculatedCollected = residents.reduce(
    (sum, r) => sum + Math.max(0, Number(r.monthly_fee || 0) - Number(r.pending || 0)),
    0
  );
  const totalRentCollectedThisMonth = Math.max(monthlyPayments, calculatedCollected);
  const totalDueRemainingThisMonth = totalPendingDues;

  const activeResidentDetails = selectedResidentDetails
    ? residents.find((r) => r.id === selectedResidentDetails.id) || selectedResidentDetails
    : null;

  const activeHistoryResident = selectedHistoryResident
    ? residents.find((r) => r.id === selectedHistoryResident.id) || selectedHistoryResident
    : null;

  const handleSendMagicLink = async (resident: ResidentRecord) => {
    setSendingLink((prev) => ({ ...prev, [resident.id]: true }));
    try {
      const res = await sendResidentMagicLink(resident.email, resident.name);
      if (res.success) {
        setLinkSentSuccess((prev) => ({ ...prev, [resident.id]: true }));
        setTimeout(() => {
          setLinkSentSuccess((prev) => ({ ...prev, [resident.id]: false }));
        }, 3500);
      } else {
        alert(`Failed to send magic link: ${res.error}`);
      }
    } catch (err: any) {
      alert(err.message || 'Error sending link');
    } finally {
      setSendingLink((prev) => ({ ...prev, [resident.id]: false }));
    }
  };

  const copySqlSnippet = () => {
    const sql = `-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_no BIGINT GENERATED BY DEFAULT AS IDENTITY (START WITH 1 INCREMENT BY 1) UNIQUE,
    name TEXT NOT NULL,
    id_proof_url TEXT,
    room_no TEXT NOT NULL,
    bed_no TEXT NOT NULL,
    caution_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0,
    monthly_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    pending NUMERIC(10, 2) NOT NULL DEFAULT 0,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_fee_payment_date DATE,
    mobile_no TEXT NOT NULL,
    email TEXT NOT NULL,
    meals_per_day INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS pending NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS joining_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS next_fee_payment_date DATE;
ALTER TABLE public.residents ADD COLUMN IF NOT EXISTS meals_per_day INTEGER DEFAULT 3;
CREATE INDEX IF NOT EXISTS idx_residents_email_lower ON public.residents (LOWER(TRIM(email)));

ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated access" ON public.residents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon to verify resident email" ON public.residents FOR SELECT TO anon USING (true);

-- RPC Function for resident email validation before magic link dispatch
CREATE OR REPLACE FUNCTION public.check_resident_email(lookup_email TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.residents WHERE LOWER(TRIM(email)) = LOWER(TRIM(lookup_email)));
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_resident_email(TEXT) TO anon, authenticated;

-- Meal Attendance Table
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
CREATE POLICY "Allow anon read of meal_attendance" ON public.meal_attendance FOR SELECT TO anon USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('resident-ids', 'resident-ids', true) ON CONFLICT (id) DO UPDATE SET public = true;
CREATE POLICY "Allow authenticated storage" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'resident-ids') WITH CHECK (bucket_id = 'resident-ids');
CREATE POLICY "Allow public storage view" ON storage.objects FOR SELECT TO public USING (bucket_id = 'resident-ids');`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const getTabHeader = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Hostel Overview',
          subtitle: 'Live summary of students, today’s food requirements & served status, and fee details',
        };
      case 'residents':
        return {
          title: 'Resident Admissions',
          subtitle: 'Manage hostel students, room allotments, and official records',
        };
      case 'meals':
        return {
          title: 'Daily Mess Attendance',
          subtitle: 'Track breakfast, lunch, and dinner meal requirements',
        };
      case 'dues':
        return {
          title: 'Fee Details & Dues',
          subtitle: 'Track monthly rent, caution deposits, and live payment status',
        };
      case 'account':
        return {
          title: 'Account Management',
          subtitle: 'Manage admin profile, password, security and hostel preferences',
        };
      default:
        return {
          title: 'Admin Portal',
          subtitle: 'Harisree Hostel Management',
        };
    }
  };

  const tabHeader = getTabHeader();

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex">
      {/* Left-Side Navigation Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        residentCount={residentCount}
        pendingCount={pendingCount}
        onOpenAddResident={() => setIsModalOpen(true)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleCollapse}
        onRefresh={fetchResidents}
        loading={loading}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#f5f5f7]">
        {/* Top Header Bar - Desktop only (removed in mobile view as per mobile phone design) */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-xl border-b border-black/[0.08] px-4 sm:px-6 lg:px-8 items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {/* Left: View Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-[#011627] font-semibold tracking-wider uppercase truncate">
                <span>Admin</span>
              </div>
              <h1 className="text-sm sm:text-base font-semibold text-[#1d1d1f] leading-tight truncate">
                {tabHeader.title}
              </h1>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Refresh Button */}
            <button
              onClick={fetchResidents}
              disabled={loading}
              title="Refresh Data"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-[#1d1d1f] bg-white hover:bg-[#f5f5f7] border border-black/[0.1] shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#011627]' : 'text-[#86868b]'}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Add Resident Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-white bg-[#011627] hover:bg-[#0b253a] shadow-sm transition cursor-pointer active:scale-[0.99]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Resident</span>
            </button>

            {/* Admin Email Badge */}
            <span className="hidden md:inline-block text-xs text-[#6e6e73] bg-[#f5f5f7] px-2.5 py-1 rounded-full border border-black/[0.06] font-mono">
              {user?.email}
            </span>
          </div>
        </header>

        {/* PWA Install Banner on mobile devices */}
        <PwaInstallPrompt />

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 pb-28 lg:pb-8">
          {/* TAB 0: HOSTEL OVERVIEW */}
          {activeTab === 'overview' && (
            <AdminOverviewView
              residents={residents}
              loading={loading}
              totalMonthlyRent={totalMonthlyRent}
              totalRentCollectedThisMonth={totalRentCollectedThisMonth}
              totalDueRemainingThisMonth={totalDueRemainingThisMonth}
              pendingCount={pendingCount}
              onOpenAddResident={() => setIsModalOpen(true)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onViewResidentDetails={(resident) => setSelectedResidentDetails(resident)}
              onRefreshAll={fetchResidents}
            />
          )}

          {/* TAB 1: RESIDENT ADMISSIONS */}
          {activeTab === 'residents' && (
            <AdminResidentsView
              residents={residents}
              loading={loading}
              tableMissing={tableMissing}
              onOpenAddResident={() => setIsModalOpen(true)}
              onViewResidentDetails={(resident: ResidentRecord) => setSelectedResidentDetails(resident)}
              onRecordPayment={(resident: ResidentRecord) => setSelectedPaymentResident(resident)}
              copySqlSnippet={copySqlSnippet}
              copiedSql={copiedSql}
              onSendMagicLink={handleSendMagicLink}
              sendingLink={sendingLink}
              linkSentSuccess={linkSentSuccess}
            />
          )}

          {/* TAB 2: DAILY MESS & FOOD ATTENDANCE */}
          {activeTab === 'meals' && <AdminMealAttendanceTab />}

          {/* TAB 3: PENDING FEE DUES */}
          {activeTab === 'dues' && (
            <AdminDuesView
              residents={residents}
              onSendMagicLink={handleSendMagicLink}
              sendingLink={sendingLink}
              linkSentSuccess={linkSentSuccess}
              onRecordPayment={(resident) => setSelectedPaymentResident(resident)}
              onViewHistory={(resident) => setSelectedHistoryResident(resident)}
              onViewResidentDetails={(resident) => setSelectedResidentDetails(resident)}
            />
          )}

          {/* TAB 4: ACCOUNT MANAGEMENT */}
          {activeTab === 'account' && (
            <AdminAccountView
              onRefresh={fetchResidents}
              loading={loading}
              residentCount={residentCount}
              totalPendingDues={totalDueRemainingThisMonth}
            />
          )}
        </main>
      </div>

      {/* Add Resident Modal */}
      <AddResidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onResidentAdded={fetchResidents}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedPaymentResident}
        resident={selectedPaymentResident}
        onClose={() => setSelectedPaymentResident(null)}
        onPaymentSuccess={fetchResidents}
      />

      {/* Fee Ledger & History Modal */}
      <FeeHistoryModal
        isOpen={!!selectedHistoryResident}
        resident={activeHistoryResident}
        onClose={() => setSelectedHistoryResident(null)}
        onResidentUpdated={fetchResidents}
      />

      {/* Resident Full Details Modal */}
      <ResidentDetailsModal
        isOpen={!!selectedResidentDetails}
        resident={activeResidentDetails}
        onClose={() => setSelectedResidentDetails(null)}
        onUpdateMealPlan={handleUpdateMealPlan}
        onResidentUpdated={fetchResidents}
        onSendMagicLink={handleSendMagicLink}
        sendingLink={sendingLink}
        linkSentSuccess={linkSentSuccess}
        onRecordPayment={(resident) => {
          setSelectedPaymentResident(resident);
        }}
        onViewHistory={(resident) => {
          setSelectedHistoryResident(resident);
        }}
      />

      {/* Mobile Floating Bottom Navigation Bar */}
      <AdminFloatingBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={fetchResidents}
      />
    </div>
  );
};
