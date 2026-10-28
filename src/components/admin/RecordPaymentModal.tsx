import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  IndianRupee,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check
} from 'lucide-react';
import type { ResidentRecord } from '../../types/auth';
import { recordResidentPayment, getTodayDateStr } from '../../lib/fees';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: ResidentRecord | null;
  onPaymentSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  resident,
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CARD'>('UPI');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateStr);
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize or reset form when resident changes
  useEffect(() => {
    if (resident && isOpen) {
      const currentPending = Number(resident.pending || 0);
      setAmount(currentPending > 0 ? String(currentPending) : String(resident.monthly_fee || ''));
      setReceiptNo(`HAR-${resident.admission_no}-${Date.now().toString().slice(-5)}`);
      setPaymentDate(getTodayDateStr());
      setNotes('');
      setError(null);
      setSuccess(null);
    }
  }, [resident, isOpen]);

  if (!isOpen || !resident) return null;

  const currentPending = Number(resident.pending || 0);
  const numAmount = parseFloat(amount) || 0;
  const remainingBalance = Math.max(0, currentPending - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a payment amount greater than ₹0');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await recordResidentPayment({
      residentId: resident.id,
      amount: numAmount,
      paymentMethod,
      receiptNo,
      paymentDate,
      description: notes.trim() || `Hostel fee payment via ${paymentMethod}`,
    });

    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to record payment');
    } else {
      setSuccess(
        `Payment of ₹${numAmount.toLocaleString()} recorded successfully! New pending balance is ₹${res.newBalance.toLocaleString()}. Receipt #${res.receiptNo}`
      );
      setTimeout(() => {
        onPaymentSuccess();
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-lg bg-white rounded-3xl border border-black/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-black/[0.08] flex items-center justify-between bg-[#fafafc]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f]">Record Fee Payment</h2>
              <p className="text-xs text-[#86868b]">
                Deduct collected rent from outstanding dues
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
        <div className="px-6 py-4 bg-[#f5f5f7] border-b border-black/[0.06] flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-[#1d1d1f] text-sm block">
              {resident.name}
            </span>
            <span className="text-[#86868b] font-mono">
              Adm #{resident.admission_no} • Room {resident.room_no} (Bed {resident.bed_no})
            </span>
          </div>

          <div className="text-right">
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Amount Input & Quick Fill Pills */}
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
              Payment Amount Received (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 absolute left-3.5 top-3 text-[#86868b]" />
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000"
                className="w-full pl-9 pr-4 py-2.5 bg-[#f5f5f7] focus:bg-white border border-black/[0.1] focus:border-[#011627] rounded-xl text-sm font-semibold text-[#1d1d1f] outline-none transition"
              />
            </div>

            {/* Quick amount presets */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-[#86868b]">Quick:</span>
              {currentPending > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(currentPending))}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f5f5f7] hover:bg-black/[0.05] text-[#515154] border border-black/[0.06] transition cursor-pointer"
                >
                  Full Due (₹{currentPending.toLocaleString()})
                </button>
              )}
              <button
                type="button"
                onClick={() => setAmount(String(resident.monthly_fee))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#f5f5f7] hover:bg-black/[0.05] text-[#515154] border border-black/[0.06] transition cursor-pointer"
              >
                1 Month (₹{Number(resident.monthly_fee).toLocaleString()})
              </button>
            </div>
          </div>

          {/* Payment Method Segmented Pills */}
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#f5f5f7] rounded-xl border border-black/[0.06]">
              {(
                [
                  { id: 'UPI', label: 'UPI / GPay' },
                  { id: 'CASH', label: 'Cash Desk' },
                  { id: 'BANK_TRANSFER', label: 'Bank Transfer' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`py-2 text-xs font-medium rounded-lg transition cursor-pointer ${
                    paymentMethod === m.id
                      ? 'bg-white text-[#1d1d1f] shadow-xs font-semibold'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
              Payment Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#86868b]" />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#f5f5f7] focus:bg-white border border-black/[0.1] focus:border-[#011627] rounded-xl text-xs text-[#1d1d1f] outline-none"
              />
            </div>
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[#1d1d1f] mb-1.5">
              Notes / Transaction Remarks (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3 top-2.5 text-[#86868b]" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. October monthly fee settled"
                className="w-full pl-9 pr-3 py-2 bg-[#f5f5f7] focus:bg-white border border-black/[0.1] focus:border-[#011627] rounded-xl text-xs text-[#1d1d1f] outline-none"
              />
            </div>
          </div>

          {/* Live Calculation Preview Card */}
          <div className="p-4 rounded-2xl bg-[#fafafc] border border-black/[0.06] space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[#86868b]">
              <span>Previous Outstanding Balance:</span>
              <span className="font-mono">₹{currentPending.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-700">
              <span>Less Payment Credited:</span>
              <span className="font-mono font-semibold">-₹{numAmount.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-sm font-semibold">
              <span className="text-[#1d1d1f]">New Remaining Balance:</span>
              <span
                className={`font-mono font-bold ${
                  remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                ₹{remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#515154] hover:text-[#1d1d1f] hover:bg-black/[0.04] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || numAmount <= 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#011627] hover:bg-[#0b253a] text-white shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording Payment...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm & Record Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
