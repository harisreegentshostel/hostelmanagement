import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  RefreshCw,
  Building2,
  Mail,
  Calendar
} from 'lucide-react';

interface AdminAccountViewProps {
  onRefresh?: () => void;
  loading?: boolean;
  residentCount?: number;
  totalPendingDues?: number;
}

export const AdminAccountView: React.FC<AdminAccountViewProps> = ({
  onRefresh,
  loading = false,
  residentCount: _residentCount = 0,
  totalPendingDues: _totalPendingDues = 0,
}) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out of the Admin Portal?')) {
      await signOut();
      navigate('/admin/login');
    }
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'A';
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
              Account
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-0 space-y-4 max-w-4xl mx-auto">
        {/* 2. PROFILE HERO CARD (WITH INTEGRATED SIGN OUT) */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar Pill */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#011627] text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-xs shrink-0 tracking-wider">
              {userInitial}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-[#1d1d1f] truncate">
                  {user?.email?.split('@')[0] || 'Administrator'}
                </h2>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#011627] bg-[#011627]/10 px-2 py-0.5 rounded-full border border-[#011627]/15 shrink-0 uppercase tracking-wide">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#86868b] mt-1 truncate font-mono">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#86868b] mt-0.5">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>Last Login: {lastSignIn}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Refresh & Sign Out */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => onRefresh?.()}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-[#f5f5f7] hover:bg-[#ebebed] border border-black/[0.04] text-[#1d1d1f] flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition disabled:opacity-50"
              title="Refresh Account Data"
              aria-label="Refresh Account Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#011627]' : 'text-[#6e6e73]'}`} />
            </button>

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
      </div>
    </div>
  );
};
