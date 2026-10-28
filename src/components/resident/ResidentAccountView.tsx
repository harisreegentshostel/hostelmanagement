import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { ResidentRecord } from '../../types/auth';
import { formatReadableDate } from '../../lib/fees';
import {
  DoorOpen,
  Bed,
  Calendar,
  Utensils,
  LogOut,
  RefreshCw
} from 'lucide-react';

interface ResidentAccountViewProps {
  residentProfile: ResidentRecord;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const ResidentAccountView: React.FC<ResidentAccountViewProps> = ({
  residentProfile,
  onRefresh,
  refreshing = false,
}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out of the Resident Portal?')) {
      await signOut();
      navigate('/login');
    }
  };

  const {
    name,
    admission_no,
    room_no,
    bed_no,
    meals_per_day,
    joining_date,
    monthly_fee,
    caution_deposit,
    pending,
  } = residentProfile;

  const pendingAmount = Number(pending || 0);

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-4">
      {/* 1. PROFILE HERO CARD (MATCHING ADMIN & KITCHEN STAFF DESIGN) */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar Pill */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#011627] text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-xs shrink-0 tracking-wider">
            {name ? name.charAt(0).toUpperCase() : 'R'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] truncate">
                {name || 'Resident'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#011627] bg-[#011627]/10 px-2 py-0.5 rounded-full border border-[#011627]/15 shrink-0 uppercase tracking-wide">
                Resident
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#86868b] mt-1 truncate">
              <DoorOpen className="w-3.5 h-3.5 text-[#011627] shrink-0" />
              <span className="font-medium text-[#1d1d1f]">
                Room {room_no || '—'} {bed_no ? `• Bed ${bed_no}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[#86868b] mt-0.5 flex-wrap">
              <span className="font-mono font-semibold bg-[#f5f5f7] px-1.5 py-0.5 rounded-md border border-black/[0.06]">
                Adm #{admission_no}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 shrink-0" />
                Joined: {formatReadableDate(joining_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Refresh & Sign Out */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
          {onRefresh && (
            <button
              onClick={() => onRefresh()}
              disabled={refreshing}
              className="w-9 h-9 rounded-xl bg-[#f5f5f7] hover:bg-[#ebebed] border border-black/[0.04] text-[#1d1d1f] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition disabled:opacity-50"
              title="Refresh Account Data"
              aria-label="Refresh Account Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#011627]' : 'text-[#6e6e73]'}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. ACCOMMODATION & STAY DETAILS */}
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868b] px-1">
          Stay & Accommodation
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#fafafc] border border-black/[0.04] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center shrink-0">
              <DoorOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-semibold text-[#86868b] block leading-none">Room</span>
              <span className="text-xs font-bold text-[#1d1d1f] truncate mt-1 block">Room {room_no || '—'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#fafafc] border border-black/[0.04] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center shrink-0">
              <Bed className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-semibold text-[#86868b] block leading-none">Bed</span>
              <span className="text-xs font-bold text-[#1d1d1f] truncate mt-1 block">Bed {bed_no || '—'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#fafafc] border border-black/[0.04] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-semibold text-[#86868b] block leading-none">Meal Plan</span>
              <span className="text-xs font-bold text-[#1d1d1f] truncate mt-1 block">
                {meals_per_day ? `${meals_per_day} Meals / Day` : 'Standard Plan'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#fafafc] border border-black/[0.04] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-semibold text-[#86868b] block leading-none">Joined</span>
              <span className="text-xs font-bold text-[#1d1d1f] truncate mt-1 block">
                {joining_date ? formatReadableDate(joining_date) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FINANCIAL SUMMARY */}
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-4 sm:p-5 space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868b] px-1">
          Financial Summary
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#fafafc] border border-black/[0.04]">
            <span className="text-[10px] uppercase font-semibold text-[#86868b] block">Monthly Rent</span>
            <span className="text-sm font-bold text-emerald-600 font-mono mt-0.5 block">
              ₹{Number(monthly_fee || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#fafafc] border border-black/[0.04]">
            <span className="text-[10px] uppercase font-semibold text-[#86868b] block">Caution Deposit</span>
            <span className="text-sm font-bold text-[#1d1d1f] font-mono mt-0.5 block">
              ₹{Number(caution_deposit || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className={`col-span-2 p-3 rounded-2xl border ${
            pendingAmount > 0
              ? 'bg-amber-50/50 border-amber-200'
              : 'bg-emerald-50/50 border-emerald-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#86868b] block">Outstanding Due</span>
                <span className={`text-base font-bold font-mono mt-0.5 block ${
                  pendingAmount > 0 ? 'text-amber-600' : 'text-emerald-700'
                }`}>
                  ₹{pendingAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                pendingAmount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {pendingAmount > 0 ? 'Payment Required' : 'All Clear ✓'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
