import React, { useState } from 'react';
import {
  CreditCard,
  AlertTriangle,
  Search,
  DoorOpen,
  CheckCircle2,
  Check,
  Sparkles,
  Loader2,
  Receipt,
  Users,
  Info,
  X,
  Building2,
  Clock,
  Eye
} from 'lucide-react';
import type { ResidentRecord } from '../../types/auth';
import { trigger1ClickWhatsAppReminder } from '../../lib/whatsapp';
import { calculatePendingDays } from '../../lib/fees';
import { ResidentDetailsModal } from './ResidentDetailsModal';
import { Pagination } from './Pagination';

interface AdminDuesViewProps {
  residents: ResidentRecord[];
  onSendMagicLink: (resident: ResidentRecord) => void;
  sendingLink: Record<string, boolean>;
  linkSentSuccess: Record<string, boolean>;
  onRecordPayment?: (resident: ResidentRecord) => void;
  onViewHistory?: (resident: ResidentRecord) => void;
  onViewResidentDetails?: (resident: ResidentRecord) => void;
}

export type PaymentFilterType = 'all' | 'pending' | 'paid';

export const AdminDuesView: React.FC<AdminDuesViewProps> = ({
  residents,
  onSendMagicLink,
  sendingLink,
  linkSentSuccess,
  onRecordPayment,
  onViewHistory,
  onViewResidentDetails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>('all');
  const [localResidentDetails, setLocalResidentDetails] = useState<ResidentRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const handleOpenDetails = (resident: ResidentRecord) => {
    if (onViewResidentDetails) {
      onViewResidentDetails(resident);
    } else {
      setLocalResidentDetails(resident);
    }
  };

  // Categorize residents
  const pendingResidents = residents.filter((r) => Number(r.pending || 0) > 0);
  const paidResidents = residents.filter((r) => Number(r.pending || 0) <= 0);

  // Financial aggregates
  const totalPendingDues = pendingResidents.reduce(
    (sum, r) => sum + Number(r.pending || 0),
    0
  );

  // Apply toggle filter
  const statusFiltered = residents.filter((r) => {
    if (paymentFilter === 'pending') {
      return Number(r.pending || 0) > 0;
    }
    if (paymentFilter === 'paid') {
      return Number(r.pending || 0) <= 0;
    }
    return true; // 'all'
  });

  // Apply search query
  const query = searchQuery.trim().toLowerCase();
  const filteredResidents = statusFiltered.filter((r) => {
    if (!query) return true;
    return (
      r.name.toLowerCase().includes(query) ||
      r.room_no.toLowerCase().includes(query) ||
      (r.bed_no && r.bed_no.toLowerCase().includes(query)) ||
      r.mobile_no.includes(query) ||
      String(r.admission_no).includes(query) ||
      (r.email && r.email.toLowerCase().includes(query))
    );
  });

  const totalItems = filteredResidents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * PAGE_SIZE;
  const paginatedResidents = filteredResidents.slice(startIndex, startIndex + PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


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
              Fee Records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
            ₹{totalPendingDues.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="px-4 sm:px-0 space-y-4">
        {/* 2. DUES HERO METRICS CARDS (MEALS PAGE DESIGN: FEE PAID, FEE PENDING, TOTAL DUE) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">
              Hostel Fee Overview
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* 1. Fee Paid */}
            <div
              onClick={() => setPaymentFilter('paid')}
              className={`p-3 rounded-2xl border text-center transition cursor-pointer active:scale-95 shadow-2xs ${
                paymentFilter === 'paid'
                  ? 'border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-300/50'
                  : 'border-emerald-200/60 bg-emerald-50/40 hover:bg-emerald-50/70'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate">Fee Paid</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-950 mt-1">
                {paidResidents.length}
              </div>
              <span className="text-[9px] text-emerald-700 block mt-0.5 font-medium">
                Residents
              </span>
            </div>

            {/* 2. Fee Pending */}
            <div
              onClick={() => setPaymentFilter('pending')}
              className={`p-3 rounded-2xl border text-center transition cursor-pointer active:scale-95 shadow-2xs ${
                paymentFilter === 'pending'
                  ? 'border-rose-300 bg-rose-50/80 ring-1 ring-rose-300/50'
                  : 'border-rose-200/60 bg-rose-50/40 hover:bg-rose-50/70'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800 mb-0.5">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                <span className="truncate">Fee Pending</span>
              </div>
              <div className="text-xl font-bold font-mono text-rose-950 mt-1">
                {pendingResidents.length}
              </div>
              <span className="text-[9px] text-rose-700 block mt-0.5 font-medium">
                Residents
              </span>
            </div>

            {/* 3. Total Due */}
            <div
              onClick={() => setPaymentFilter('all')}
              className={`p-3 rounded-2xl border text-center transition cursor-pointer active:scale-95 shadow-2xs ${
                paymentFilter === 'all'
                  ? 'border-rose-300 bg-rose-50/80 ring-1 ring-rose-300/50'
                  : 'border-rose-200/60 bg-rose-50/40 hover:bg-rose-50/70'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800 mb-0.5">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                <span className="truncate">Total Due</span>
              </div>
              <div className="text-base sm:text-xl font-bold font-mono text-rose-950 mt-1 truncate px-0.5">
                ₹{totalPendingDues.toLocaleString()}
              </div>
              <span className="text-[9px] text-rose-700 block mt-0.5 font-medium">
                Due amount
              </span>
            </div>
          </div>
        </div>

        {/* 3. FILTER PILLS & SEARCH */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-1.5 bg-[#efeff4] p-1.5 rounded-2xl text-xs">
            <button
              type="button"
              onClick={() => {
                setPaymentFilter('all');
                setCurrentPage(1);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center truncate ${
                paymentFilter === 'all'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              All ({residents.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentFilter('pending');
                setCurrentPage(1);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center truncate ${
                paymentFilter === 'pending'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-[#6e6e73] hover:text-rose-700'
              }`}
            >
              Pending ({pendingResidents.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentFilter('paid');
                setCurrentPage(1);
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center truncate ${
                paymentFilter === 'paid'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-[#6e6e73] hover:text-emerald-700'
              }`}
            >
              Paid ({paidResidents.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b] pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, room, adm..."
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

        {/* 4. RESIDENT FEE LIST */}
        {residents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-black/[0.06] space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#011627]/[0.04] text-[#011627] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f]">No Resident Fee Records</h3>
            <p className="text-xs text-[#86868b] max-w-xs mx-auto">
              Add residents in the Resident Admissions tab to track monthly fees, caution deposits, and dues.
            </p>
          </div>
        ) : paymentFilter === 'pending' && pendingResidents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-black/[0.06] space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f]">All Dues Cleared!</h3>
            <p className="text-xs text-[#86868b] max-w-xs mx-auto">
              There are currently no residents with outstanding fees or pending rent dues.
            </p>
          </div>
        ) : paymentFilter === 'paid' && paidResidents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-black/[0.06] space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1d1d1f]">No Fully Paid Residents Yet</h3>
            <p className="text-xs text-[#86868b] max-w-xs mx-auto">
              All registered residents currently have outstanding fee dues to be cleared.
            </p>
          </div>
        ) : filteredResidents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-black/[0.06] text-xs text-[#86868b]">
            No {paymentFilter === 'pending' ? 'pending' : paymentFilter === 'paid' ? 'paid' : ''} fee records match &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <>
            {/* Mobile Native Card List: Standalone touch cards (No nested outer card!) */}
            <div className="sm:hidden space-y-3">
              {paginatedResidents.map((r) => {
                const isPending = Number(r.pending || 0) > 0;
                const isCleared = Number(r.pending || 0) === 0;
                const pendingDays = isPending ? calculatePendingDays(r) : 0;

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3.5"
                  >
                    {/* Header Row: Admission #, Name, Room/Bed, and Due Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-xs text-[#011627] bg-[#011627]/[0.08] px-2 py-1 rounded-xl border border-[#011627]/10 shrink-0">
                          #{r.admission_no}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-bold text-[#1d1d1f] text-sm sm:text-base leading-snug truncate">
                            {r.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-[#86868b] mt-0.5">
                            <DoorOpen className="w-3.5 h-3.5 text-[#011627]" />
                            <span>Room {r.room_no}</span>
                            {r.bed_no && <span className="text-[#86868b]">• Bed {r.bed_no}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Due Status Badge */}
                      <div className="shrink-0 text-right">
                        {isPending ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>₹{Number(r.pending).toLocaleString()} Due</span>
                            </span>
                            {pendingDays > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 pr-1">
                                <Clock className="w-3 h-3 text-rose-500" />
                                <span>{pendingDays} {pendingDays === 1 ? 'day' : 'days'} pending</span>
                              </span>
                            )}
                          </div>
                        ) : isCleared ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Fee Paid</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#011627]/[0.08] text-[#011627] border border-[#011627]/20">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>₹{Math.abs(Number(r.pending)).toLocaleString()} Adv</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Financial details: Monthly Fee and Monthly Due Date */}
                    <div className="bg-[#fbfbfd] p-3 rounded-2xl border border-black/[0.04] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#86868b] uppercase font-semibold block leading-tight">
                          Monthly Fee
                        </span>
                        <span className="font-mono font-bold text-[#1d1d1f] text-sm mt-0.5 block">
                          ₹{Number(r.monthly_fee || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#86868b] uppercase font-semibold block leading-tight">
                          Monthly Due Date
                        </span>
                        <span className="font-mono font-semibold text-[#011627] text-xs mt-0.5 block">
                          {r.next_fee_payment_date ? (
                            r.next_fee_payment_date
                          ) : r.fee_due_day ? (
                            `${r.fee_due_day}th of every month`
                          ) : (
                            '5th of every month'
                          )}
                        </span>
                        {isPending && pendingDays > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                            {pendingDays} {pendingDays === 1 ? 'day' : 'days'} pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => onRecordPayment?.(r)}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer active:scale-95"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => trigger1ClickWhatsAppReminder(r)}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs transition cursor-pointer active:scale-95"
                        title="Text on WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.06 7.42C8.89 7.42 8.61 7.49 8.37 7.74C8.13 8 7.45 8.63 7.45 9.94C7.45 11.25 8.4 12.52 8.53 12.7C8.66 12.87 10.37 15.65 13.06 16.7C15.31 17.57 15.76 17.4 16.25 17.36C16.74 17.31 17.84 16.7 18.07 16.06C18.3 15.41 18.3 14.86 18.23 14.74C18.16 14.62 17.99 14.56 17.73 14.43C17.48 14.3 16.25 13.7 16.02 13.61C15.79 13.53 15.63 13.48 15.46 13.74C15.29 14 14.81 14.56 14.66 14.73C14.52 14.9 14.37 14.92 14.12 14.8C13.86 14.67 12.79 14.28 11.51 13.14C10.52 12.26 9.85 11.17 9.65 10.83C9.46 10.49 9.63 10.3 9.76 10.17C9.88 10.05 10.02 9.86 10.16 9.7C10.29 9.53 10.34 9.4 10.43 9.23C10.51 9.06 10.47 8.91 10.41 8.78C10.34 8.65 9.83 7.41 9.62 6.9C9.41 6.4 9.2 6.47 9.05 6.47L9.06 7.42Z" />
                        </svg>
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewHistory?.(r)}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#f5f5f7] hover:bg-black/[0.05] text-[#1d1d1f] border border-black/[0.08] transition cursor-pointer active:scale-95"
                        title="View Payment Ledger"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#011627]" />
                        <span>Ledger</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDetails(r)}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-[#011627]/[0.06] hover:bg-[#011627]/[0.12] text-[#011627] border border-[#011627]/12 transition cursor-pointer active:scale-95"
                        title="View All Resident Data"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#011627]" />
                        <span>View More</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white border border-black/[0.06] rounded-3xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1d1d1f]">
                  <thead className="bg-[#fafafc] border-b border-black/[0.06] text-[#86868b] uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Adm #</th>
                      <th className="px-5 py-3.5">Resident</th>
                      <th className="px-5 py-3.5">Room</th>
                      <th className="px-5 py-3.5">Monthly Rent</th>
                      <th className="px-5 py-3.5">Deposit</th>
                      <th className="px-5 py-3.5">Payment Status</th>
                      <th className="px-4 py-3.5 text-center">Record Payment</th>
                      <th className="px-4 py-3.5 text-center">WhatsApp</th>
                      <th className="px-4 py-3.5 text-center">History</th>
                      <th className="px-4 py-3.5 text-center">Portal Link</th>
                      <th className="px-4 py-3.5 text-center">Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.05]">
                    {paginatedResidents.map((r) => {
                      const isPending = Number(r.pending || 0) > 0;
                      const isCleared = Number(r.pending || 0) === 0;
                      const pendingDays = isPending ? calculatePendingDays(r) : 0;

                      return (
                        <tr key={r.id} className="hover:bg-[#f5f5f7]/60 transition">
                          <td className="px-5 py-4 font-mono font-bold text-[#1d1d1f]">
                            #{r.admission_no}
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[#1d1d1f] text-sm">{r.name}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#f5f5f7] text-[#1d1d1f] border border-black/[0.08]">
                              <DoorOpen className="w-3 h-3 text-[#011627]" />
                              Room {r.room_no}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-mono text-[#1d1d1f] font-semibold">
                              ₹{Number(r.monthly_fee || 0).toLocaleString()} /mo
                            </div>
                            {r.next_fee_payment_date ? (
                              <div className="text-[10px] text-[#011627] font-medium mt-0.5">
                                Due: {r.next_fee_payment_date}
                              </div>
                            ) : r.fee_due_day ? (
                              <div className="text-[10px] text-[#86868b] font-medium mt-0.5">
                                Due: {r.fee_due_day}th monthly
                              </div>
                            ) : null}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-[#515154]">
                              ₹{Number(r.caution_deposit || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {isPending ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  ₹{Number(r.pending).toLocaleString()} Due
                                </span>
                                {pendingDays > 0 && (
                                  <div className="text-[10px] font-bold text-rose-600 flex items-center gap-1 pl-1">
                                    <Clock className="w-3 h-3 text-rose-500" />
                                    <span>{pendingDays} {pendingDays === 1 ? 'day' : 'days'} pending</span>
                                  </div>
                                )}
                              </div>
                            ) : isCleared ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Paid (₹0 Due)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#011627]/[0.08] text-[#011627] border border-[#011627]/20">
                                <Sparkles className="w-3.5 h-3.5" />
                                ₹{Math.abs(Number(r.pending)).toLocaleString()} Advance
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => onRecordPayment?.(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Record Payment</span>
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => trigger1ClickWhatsAppReminder(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs transition cursor-pointer"
                            >
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.06 7.42C8.89 7.42 8.61 7.49 8.37 7.74C8.13 8 7.45 8.63 7.45 9.94C7.45 11.25 8.4 12.52 8.53 12.7C8.66 12.87 10.37 15.65 13.06 16.7C15.31 17.57 15.76 17.4 16.25 17.36C16.74 17.31 17.84 16.7 18.07 16.06C18.3 15.41 18.3 14.86 18.23 14.74C18.16 14.62 17.99 14.56 17.73 14.43C17.48 14.3 16.25 13.7 16.02 13.61C15.79 13.53 15.63 13.48 15.46 13.74C15.29 14 14.81 14.56 14.66 14.73C14.52 14.9 14.37 14.92 14.12 14.8C13.86 14.67 12.79 14.28 11.51 13.14C10.52 12.26 9.85 11.17 9.65 10.83C9.46 10.49 9.63 10.3 9.76 10.17C9.88 10.05 10.02 9.86 10.16 9.7C10.29 9.53 10.34 9.4 10.43 9.23C10.51 9.06 10.47 8.91 10.41 8.78C10.34 8.65 9.83 7.41 9.62 6.9C9.41 6.4 9.2 6.47 9.05 6.47L9.06 7.42Z" />
                              </svg>
                              <span>WhatsApp</span>
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => onViewHistory?.(r)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#f5f5f7] hover:bg-black/[0.05] text-[#1d1d1f] border border-black/[0.08] transition cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-[#011627]" />
                              <span>History</span>
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => onSendMagicLink(r)}
                              disabled={sendingLink[r.id]}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                                linkSentSuccess[r.id]
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isPending
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-[#f5f5f7] hover:bg-black/[0.05] text-[#1d1d1f] border border-black/[0.08]'
                              }`}
                            >
                              {sendingLink[r.id] ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Sending...</span>
                                </>
                              ) : linkSentSuccess[r.id] ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Sent!</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles
                                    className={`w-3.5 h-3.5 ${
                                      isPending ? 'text-rose-600' : 'text-[#011627]'
                                    }`}
                                  />
                                  <span>Send Link</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(r)}
                              className="w-8 h-8 rounded-full inline-flex items-center justify-center bg-[#011627]/[0.06] hover:bg-[#011627]/[0.12] text-[#011627] border border-[#011627]/15 transition cursor-pointer active:scale-95 shadow-2xs"
                              aria-label="View complete resident details"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}
            <Pagination
              currentPage={validPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              itemName="records"
            />
          </>
        )}
      </div>

      {/* Fallback Resident Full Details Modal if parent does not provide onViewResidentDetails */}
      {!onViewResidentDetails && localResidentDetails && (
        <ResidentDetailsModal
          isOpen={!!localResidentDetails}
          resident={localResidentDetails}
          onClose={() => setLocalResidentDetails(null)}
          onResidentUpdated={(updated) => setLocalResidentDetails(updated)}
          onSendMagicLink={onSendMagicLink}
          sendingLink={sendingLink}
          linkSentSuccess={linkSentSuccess}
        />
      )}
    </div>
  );
};
