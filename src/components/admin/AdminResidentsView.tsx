import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  DoorOpen,
  Bed,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X,
  CreditCard,
  Phone,
  AlertCircle,
  Check,
  Copy,
  Building2,
  Loader2,
  Sparkles
} from 'lucide-react';
import type { ResidentRecord } from '../../types/auth';
import { Pagination } from './Pagination';

interface AdminResidentsViewProps {
  residents: ResidentRecord[];
  loading: boolean;
  tableMissing: boolean;
  onOpenAddResident: () => void;
  onViewResidentDetails: (resident: ResidentRecord) => void;
  onRecordPayment?: (resident: ResidentRecord) => void;
  copySqlSnippet: () => void;
  copiedSql: boolean;
  onSendMagicLink?: (resident: ResidentRecord) => void;
  sendingLink?: Record<string, boolean>;
  linkSentSuccess?: Record<string, boolean>;
}

export const AdminResidentsView: React.FC<AdminResidentsViewProps> = ({
  residents,
  loading: _loading,
  tableMissing,
  onOpenAddResident,
  onViewResidentDetails,
  onRecordPayment,
  copySqlSnippet,
  copiedSql,
  onSendMagicLink,
  sendingLink,
  linkSentSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  const filteredResidents = residents.filter((r) => {
    const query = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(query) ||
      r.room_no.toLowerCase().includes(query) ||
      r.mobile_no.includes(query) ||
      String(r.admission_no).includes(query)
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
              Residents
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-0 space-y-4">
        {/* Supabase Notice if missing */}
        {tableMissing && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs">
                <strong>Database Setup Required</strong>: <code className="bg-amber-100 px-1 py-0.5 rounded">residents</code> table missing.
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

        {/* 2. SEARCH BAR & ADD STUDENT BUTTON */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
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

          <button
            type="button"
            onClick={onOpenAddResident}
            title="Add Resident"
            aria-label="Add Resident"
            className="w-[50px] h-[50px] rounded-2xl text-white bg-[#011627] hover:bg-[#0b253a] shadow-2xs active:scale-95 transition cursor-pointer shrink-0 flex items-center justify-center"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* 4. RESIDENTS LIST: MOBILE NATIVE CARDS & DESKTOP TABLE */}
        {residents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-black/[0.06] space-y-3">
            <Users className="w-10 h-10 text-[#86868b]/40 mx-auto" />
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f]">No Residents Registered</h3>
              <p className="text-xs text-[#86868b] mt-0.5">
                Register your first hostel resident to get started.
              </p>
            </div>
            <button
              onClick={onOpenAddResident}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#011627] shadow-xs active:scale-95 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add First Resident</span>
            </button>
          </div>
        ) : filteredResidents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-black/[0.06]">
            <Search className="w-8 h-8 text-[#86868b]/40 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-[#1d1d1f]">No Matching Residents</h3>
            <p className="text-xs text-[#86868b] mt-0.5">
              No students match &quot;{searchQuery}&quot;.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE VIEW: NATIVE STUDENT CARDS */}
            <div className="sm:hidden space-y-3">
              {paginatedResidents.map((r) => {
                const isPending = Number(r.pending || 0) > 0;
                return (
                  <div
                    key={r.id}
                    onClick={() => onViewResidentDetails(r)}
                    className="p-4 rounded-3xl bg-white border border-black/[0.06] shadow-2xs space-y-3 active:scale-[0.99] transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-[#011627]/[0.06] text-[#011627] flex flex-col items-center justify-center font-bold text-xs shrink-0 border border-[#011627]/10">
                          <span className="text-[8px] uppercase text-[#86868b] leading-none">ADM</span>
                          <span className="leading-none mt-0.5">#{r.admission_no}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs text-[#1d1d1f] truncate">
                            {r.name}
                          </h3>
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

                      <div className="shrink-0">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            ₹{Number(r.pending).toLocaleString()} Due
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Cleared
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6e6e73] pt-2 border-t border-black/[0.04]">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#86868b]" />
                        {r.mobile_no}
                      </span>
                      <span className="font-mono font-semibold text-[#1d1d1f]">
                        ₹{Number(r.monthly_fee || 0).toLocaleString()} /mo
                      </span>
                    </div>

                    {/* Touch Action Buttons */}
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onViewResidentDetails(r)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold bg-[#011627]/10 hover:bg-[#011627]/15 text-[#011627] border border-[#011627]/15 transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      {onSendMagicLink && (
                        <button
                          type="button"
                          onClick={() => onSendMagicLink(r)}
                          disabled={sendingLink?.[r.id]}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0 ${
                            linkSentSuccess?.[r.id]
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}
                          title="Send Supabase authentication magic link"
                        >
                          {sendingLink?.[r.id] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : linkSentSuccess?.[r.id] ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          <span>{linkSentSuccess?.[r.id] ? 'Sent!' : 'Send Link'}</span>
                        </button>
                      )}

                      {isPending && onRecordPayment && (
                        <button
                          type="button"
                          onClick={() => onRecordPayment(r)}
                          className="py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW: CLEAN TABLE */}
            <div className="hidden sm:block bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-[#1d1d1f]">
                <thead className="bg-[#fafafc] border-b border-black/[0.06] text-[#86868b] uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Adm No</th>
                    <th className="px-5 py-3.5">Resident Name</th>
                    <th className="px-5 py-3.5">Room & Bed</th>
                    <th className="px-5 py-3.5">Fee Status</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {paginatedResidents.map((r) => {
                    const isPending = Number(r.pending || 0) > 0;
                    return (
                      <tr key={r.id} className="hover:bg-[#f5f5f7]/60 transition">
                        <td className="px-5 py-4 font-mono font-bold text-[#011627]">
                          #{r.admission_no}
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#1d1d1f] text-sm">
                          {r.name}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#f5f5f7] border border-black/[0.08]">
                            <DoorOpen className="w-3.5 h-3.5 text-[#011627]" />
                            Room {r.room_no} • Bed {r.bed_no}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              ₹{Number(r.pending).toLocaleString()} Due
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Cleared
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewResidentDetails(r)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#011627]/10 hover:bg-[#011627]/15 text-[#011627] border border-[#011627]/20 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {onSendMagicLink && (
                              <button
                                type="button"
                                onClick={() => onSendMagicLink(r)}
                                disabled={sendingLink?.[r.id]}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                  linkSentSuccess?.[r.id]
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                }`}
                                title="Send Supabase authentication magic link"
                              >
                                {sendingLink?.[r.id] ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : linkSentSuccess?.[r.id] ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                )}
                                <span>{linkSentSuccess?.[r.id] ? 'Sent!' : 'Send Link'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
