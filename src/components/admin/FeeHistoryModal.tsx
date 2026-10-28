import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Receipt,
  Loader2,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react';
import type { ResidentRecord, FeeTransaction } from '../../types/auth';
import { fetchResidentFeeTransactions, formatReadableDate, getDayOrdinal } from '../../lib/fees';
import { supabase } from '../../lib/supabase';

function computeNextDueDate(dateStr?: string | null, dueDay?: number | null): string {
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      return dateStr;
    }
  }

  const day = dueDay && dueDay >= 1 && dueDay <= 31 ? dueDay : 5;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDay = now.getDate();

  let targetYear = year;
  let targetMonth = month;
  if (todayDay > day) {
    targetMonth = month + 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear = year + 1;
    }
  }

  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const validDay = Math.min(day, maxDays);
  const m = String(targetMonth + 1).padStart(2, '0');
  const d = String(validDay).padStart(2, '0');
  return `${targetYear}-${m}-${d}`;
}

interface FeeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: ResidentRecord | null;
  onResidentUpdated?: (updatedResident: ResidentRecord) => void;
}

export const FeeHistoryModal: React.FC<FeeHistoryModalProps> = ({
  isOpen,
  onClose,
  resident,
  onResidentUpdated,
}) => {
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextDueDate, setNextDueDate] = useState<string>(() =>
    computeNextDueDate(resident?.next_fee_payment_date, resident?.fee_due_day)
  );
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [savingDueDate, setSavingDueDate] = useState(false);

  useEffect(() => {
    if (resident && isOpen) {
      setNextDueDate(computeNextDueDate(resident.next_fee_payment_date, resident.fee_due_day));
      setIsEditingDueDate(false);
      setLoading(true);
      setError(null);
      fetchResidentFeeTransactions(resident.id).then(({ data, error }) => {
        setLoading(false);
        if (error) {
          setError(error);
        } else {
          setTransactions(data);
        }
      });
    }
  }, [resident, isOpen]);

  if (!isOpen || !resident) return null;

  const currentPending = Number(resident.pending || 0);
  const fixedDay = resident.fee_due_day || (nextDueDate ? parseInt(nextDueDate.split('-')[2], 10) : 5);

  const handleSaveDueDate = async (newDateStr: string) => {
    if (!newDateStr || !resident) return;
    setSavingDueDate(true);
    try {
      const parts = newDateStr.split('-');
      const newDay = parts[2] ? parseInt(parts[2], 10) : 5;

      const { error: updateErr } = await supabase
        .from('residents')
        .update({
          next_fee_payment_date: newDateStr,
          fee_due_day: newDay,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resident.id);

      if (updateErr) throw updateErr;

      setNextDueDate(newDateStr);
      setIsEditingDueDate(false);

      if (onResidentUpdated) {
        onResidentUpdated({
          ...resident,
          next_fee_payment_date: newDateStr,
          fee_due_day: newDay,
        });
      }
    } catch (err) {
      console.error('Failed to update next fee due date:', err);
    } finally {
      setSavingDueDate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-black/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-black/[0.08] flex items-center justify-between bg-[#fafafc]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-[#011627]/10 text-[#011627]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f]">
                Fee Ledger & Payment History
              </h2>
              <p className="text-xs text-[#86868b]">
                Audit history of monthly fees and payments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#86868b] hover:text-[#1d1d1f] rounded-xl hover:bg-black/[0.05] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resident Summary Banner */}
        <div className="px-6 py-4 bg-[#f5f5f7] border-b border-black/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[11px] text-[#86868b] block">Resident</span>
            <span className="font-semibold text-[#1d1d1f] truncate block">
              {resident.name}
            </span>
            <span className="text-[#86868b] font-mono text-[10px]">
              Adm #{resident.admission_no} • Rm {resident.room_no}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-[#86868b] block">Monthly Rent</span>
            <span className="font-mono font-semibold text-[#1d1d1f]">
              ₹{Number(resident.monthly_fee || 0).toLocaleString()}
            </span>
            <span className="text-[#86868b] text-[10px] block">
              Due on {getDayOrdinal(fixedDay)} monthly
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] text-[#86868b] block">Next Due Date</span>
              <button
                type="button"
                onClick={() => setIsEditingDueDate(!isEditingDueDate)}
                className="text-[10px] text-[#011627] hover:underline font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                title="Change next due date"
              >
                <Calendar className="w-3 h-3 text-[#011627]" />
                <span>{isEditingDueDate ? 'Done' : 'Change'}</span>
              </button>
            </div>

            {isEditingDueDate ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="date"
                  value={nextDueDate}
                  disabled={savingDueDate}
                  onChange={(e) => handleSaveDueDate(e.target.value)}
                  className="w-full text-xs font-mono font-semibold bg-white border border-[#011627]/40 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-[#011627] text-[#011627]"
                />
                {savingDueDate && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#011627] shrink-0" />}
              </div>
            ) : (
              <span className="font-mono font-semibold text-[#011627] text-xs sm:text-sm block">
                {formatReadableDate(nextDueDate)}
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] text-[#86868b] block">Current Total Due</span>
            <span
              className={`font-mono font-bold text-sm ${
                currentPending > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              ₹{currentPending.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Modal Body / History Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#86868b]">
              <Loader2 className="w-6 h-6 animate-spin text-[#011627] mb-2" />
              <span className="text-xs">Loading fee ledger...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#86868b]">
              <FileText className="w-8 h-8 mx-auto text-[#86868b] mb-2 opacity-50" />
              <p className="font-medium text-[#1d1d1f]">No transactions recorded yet</p>
              <p className="mt-1 max-w-xs mx-auto">
                Transactions will appear here automatically when monthly fees are billed on the {getDayOrdinal(fixedDay)} of each month or when payments are recorded.
              </p>
            </div>
          ) : (
            <div className="border border-black/[0.06] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#fafafc] border-b border-black/[0.06] text-[#86868b] uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {transactions.map((tx) => {
                    const isPayment = tx.type === 'PAYMENT';
                    const isFee = tx.type === 'MONTHLY_FEE';

                    return (
                      <tr key={tx.id} className="hover:bg-[#f5f5f7]/50 transition">
                        {/* Date */}
                        <td className="px-4 py-3 font-mono text-[#515154] whitespace-nowrap">
                          {formatReadableDate(tx.billing_date || tx.created_at.split('T')[0])}
                        </td>

                        {/* Type Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isPayment ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <TrendingDown className="w-3 h-3 text-emerald-600" />
                              Payment
                            </span>
                          ) : isFee ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#011627]/[0.08] text-[#011627] border border-[#011627]/20">
                              <TrendingUp className="w-3 h-3 text-[#011627]" />
                              Monthly Fee
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Opening Balance
                            </span>
                          )}
                        </td>

                        {/* Description & Method */}
                        <td className="px-4 py-3 text-[#1d1d1f]">
                          <div>{tx.description || 'Hostel Fee Transaction'}</div>
                          {tx.receipt_no && (
                            <div className="text-[10px] text-[#86868b] font-mono mt-0.5">
                              Receipt #{tx.receipt_no}
                              {tx.payment_method ? ` • ${tx.payment_method}` : ''}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right font-mono font-semibold whitespace-nowrap">
                          {isPayment ? (
                            <span className="text-emerald-700">-₹{Number(tx.amount).toLocaleString()}</span>
                          ) : (
                            <span className="text-[#011627]">+₹{Number(tx.amount).toLocaleString()}</span>
                          )}
                        </td>

                        {/* Resulting Balance */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#1d1d1f] whitespace-nowrap">
                          ₹{Number(tx.balance_after).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-black/[0.08] bg-[#fafafc] flex items-center justify-between text-xs">
          <span className="text-[#86868b]">
            Total Entries: {transactions.length}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f5f5f7] hover:bg-black/[0.05] text-[#1d1d1f] border border-black/[0.08] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
