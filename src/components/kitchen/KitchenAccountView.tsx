import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  LogOut,
  Building2,
  Utensils,
  Calendar
} from 'lucide-react';

export const KitchenAccountView: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out of the Kitchen Staff Portal?')) {
      await signOut();
      navigate('/admin/login?staff');
    }
  };

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Active Session';

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      {/* 1. PROFILE HERO CARD (MATCHING ADMIN & RESIDENT DESIGN) */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Avatar Pill */}
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#011627] text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-xs shrink-0 tracking-wider">
            KS
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] truncate">
                Kitchen Staff
              </h2>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#011627] bg-[#011627]/10 px-2 py-0.5 rounded-full border border-[#011627]/15 shrink-0 uppercase tracking-wide">
                Staff
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#86868b] mt-1 truncate font-mono">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user?.email || 'harisreehostel@staff.com'}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#86868b] mt-0.5">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Last Login: {lastSignIn}</span>
            </div>
          </div>
        </div>

        {/* Action Button: Sign Out */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition active:scale-95 cursor-pointer shadow-2xs shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. FACILITY & ACCESS CARD */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
        <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
          Facility & Access
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#fbfbfd] border border-black/[0.04]">
            <div className="w-9 h-9 rounded-xl bg-[#011627]/10 text-[#011627] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                Hostel Facility
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#1d1d1f] truncate mt-0.5">
                Harisree Hostel
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#fbfbfd] border border-black/[0.04]">
            <div className="w-9 h-9 rounded-xl bg-[#011627]/10 text-[#011627] flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">
                Portal Access
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#1d1d1f] truncate mt-0.5">
                Kitchen & Mess Service
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
