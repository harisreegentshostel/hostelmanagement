import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  DoorOpen,
  Bed,
  Utensils,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ExternalLink,
  Sparkles,
  Receipt,
  Copy,
  Check,
  Loader2,
  Upload,
  PhoneCall,
  Edit2,
  Calendar
} from 'lucide-react';
import type { ResidentRecord } from '../../types/auth';
import { trigger1ClickWhatsAppReminder } from '../../lib/whatsapp';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../lib/imageCompression';

interface ResidentDetailsModalProps {
  isOpen: boolean;
  resident: ResidentRecord | null;
  onClose: () => void;
  onUpdateMealPlan?: (residentId: string, newMealsPerDay: number) => Promise<void>;
  onResidentUpdated?: (resident: ResidentRecord) => void;
  onSendMagicLink?: (resident: ResidentRecord) => void;
  sendingLink?: Record<string, boolean>;
  linkSentSuccess?: Record<string, boolean>;
  onRecordPayment?: (resident: ResidentRecord) => void;
  onViewHistory?: (resident: ResidentRecord) => void;
}

export const ResidentDetailsModal: React.FC<ResidentDetailsModalProps> = ({
  isOpen,
  resident,
  onClose,
  onUpdateMealPlan,
  onResidentUpdated,
  onSendMagicLink,
  sendingLink = {},
  linkSentSuccess = {},
  onRecordPayment,
  onViewHistory,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [updatingMealPlan, setUpdatingMealPlan] = useState(false);
  const [currentIdProofUrl, setCurrentIdProofUrl] = useState<string | null>(resident?.id_proof_url || null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Financial editing states (Monthly rent, Next due date, cycle)
  const [currentMonthlyRent, setCurrentMonthlyRent] = useState<number>(Number(resident?.monthly_fee || 0));
  const [currentNextDueDate, setCurrentNextDueDate] = useState<string>(resident?.next_fee_payment_date || '');
  const [currentFeeDueDay, setCurrentFeeDueDay] = useState<number>(resident?.fee_due_day || 5);
  const [isEditingRent, setIsEditingRent] = useState(false);
  const [rentInput, setRentInput] = useState<string>(String(resident?.monthly_fee || 0));
  const [savingRent, setSavingRent] = useState(false);

  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDateInput, setDueDateInput] = useState<string>(resident?.next_fee_payment_date || '');
  const [dueCycle, setDueCycle] = useState<'monthly' | 'weekly'>('monthly');
  const [savingDueDate, setSavingDueDate] = useState(false);

  useEffect(() => {
    setCurrentIdProofUrl(resident?.id_proof_url || null);
    setUploadError(null);
    if (resident) {
      setCurrentMonthlyRent(Number(resident.monthly_fee || 0));
      setRentInput(String(resident.monthly_fee || 0));
      setIsEditingRent(false);

      const nextDate = resident.next_fee_payment_date || '';
      setCurrentNextDueDate(nextDate);
      setDueDateInput(nextDate);
      setCurrentFeeDueDay(resident.fee_due_day || 5);
      setIsEditingDueDate(false);
    }
  }, [resident]);

  if (!isOpen || !resident) return null;

  const isPending = Number(resident.pending || 0) > 0;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(resident.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleMealChange = async (val: number) => {
    if (!onUpdateMealPlan) return;
    setUpdatingMealPlan(true);
    try {
      await onUpdateMealPlan(resident.id, val);
    } finally {
      setUpdatingMealPlan(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !resident) return;

    setIsUploadingProof(true);
    setUploadError(null);
    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          const comp = await compressImage(file, 1600, 1600, 0.8);
          fileToUpload = comp.file;
        } catch {
          // fallback to original file
        }
      }

      const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
      const fileName = `admission_${resident.admission_no || resident.id}_${Date.now()}.${fileExt}`;
      const filePath = `id_proofs/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('resident-ids')
        .upload(filePath, fileToUpload, {
          contentType: fileToUpload.type,
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(`Upload error: ${uploadErr.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('resident-ids')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const { error: dbErr } = await supabase
        .from('residents')
        .update({ id_proof_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', resident.id);

      if (dbErr) throw dbErr;

      setCurrentIdProofUrl(publicUrl);
      if (onResidentUpdated) {
        onResidentUpdated({ ...resident, id_proof_url: publicUrl });
      }
    } catch (err: any) {
      console.error('Error uploading ID proof:', err);
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setIsUploadingProof(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveRent = async () => {
    if (!resident) return;
    const newRent = parseFloat(rentInput);
    if (isNaN(newRent) || newRent < 0) return;

    setSavingRent(true);
    try {
      const { error: err } = await supabase
        .from('residents')
        .update({
          monthly_fee: newRent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resident.id);

      if (err) throw err;

      setCurrentMonthlyRent(newRent);
      setIsEditingRent(false);
      onResidentUpdated?.({ ...resident, monthly_fee: newRent });
    } catch (err: any) {
      console.error('Failed to update rent:', err);
    } finally {
      setSavingRent(false);
    }
  };

  const handleSaveDueDate = async (selectedDate: string, selectedCycle?: 'monthly' | 'weekly') => {
    if (!resident || !selectedDate) return;
    setSavingDueDate(true);
    try {
      const parts = selectedDate.split('-');
      const newDay = parts[2] ? parseInt(parts[2], 10) : 5;

      const { error: err } = await supabase
        .from('residents')
        .update({
          next_fee_payment_date: selectedDate,
          fee_due_day: newDay,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resident.id);

      if (err) throw err;

      setCurrentNextDueDate(selectedDate);
      setCurrentFeeDueDay(newDay);
      if (selectedCycle) setDueCycle(selectedCycle);
      setIsEditingDueDate(false);
      onResidentUpdated?.({
        ...resident,
        next_fee_payment_date: selectedDate,
        fee_due_day: newDay,
      });
    } catch (err: any) {
      console.error('Failed to update due date:', err);
    } finally {
      setSavingDueDate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-black/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-black/[0.08] flex items-center justify-between bg-[#fafafc]">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#011627]/10 text-[#011627] flex items-center justify-center font-bold text-base shrink-0">
              {resident.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-[#1d1d1f]">
                  {resident.name}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-[#f5f5f7] border border-black/[0.08] text-[#011627] font-semibold">
                  Adm #{resident.admission_no}
                </span>
              </div>
              <p className="text-xs text-[#86868b] mt-0.5">
                Complete resident profile, room allotment, and fee records
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

        {/* Modal Content - Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Quick Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.06]">
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">
                Room & Bed
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f] mt-1 block">
                Room {resident.room_no} • Bed {resident.bed_no}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.06]">
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">
                Joining Date
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f] mt-1 block font-mono">
                {resident.joining_date || 'N/A'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.06]">
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">
                Monthly Rent
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#1d1d1f] mt-1 block font-mono">
                ₹{Number(currentMonthlyRent).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-black/[0.06]">
              <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider block">
                Current Dues
              </span>
              <span
                className={`text-xs sm:text-sm font-semibold mt-1 block font-mono ${
                  isPending ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {isPending
                  ? `₹${Number(resident.pending).toLocaleString()} Due`
                  : '₹0 (Cleared)'}
              </span>
            </div>
          </div>

          {/* Section 1: Contact & Personal Information */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-[#011627]" />
              <span>Contact & Personal Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Email */}
              <div className="p-3 rounded-xl bg-[#fafafc] border border-black/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-[#86868b] shrink-0" />
                  <span className="truncate text-[#1d1d1f]">{resident.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  title="Copy Email"
                  className="p-1 text-[#86868b] hover:text-[#1d1d1f] rounded hover:bg-black/[0.04] transition cursor-pointer shrink-0 ml-2"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Phone */}
              <div className="p-3 rounded-xl bg-[#fafafc] border border-black/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#86868b] shrink-0" />
                  <a
                    href={`tel:${resident.mobile_no}`}
                    className="font-mono text-[#1d1d1f] hover:text-[#011627] font-medium"
                  >
                    {resident.mobile_no}
                  </a>
                </div>
                <a
                  href={`tel:${resident.mobile_no}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition active:scale-95 shrink-0 ml-2 shadow-2xs"
                  title="Call Resident"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call</span>
                </a>
              </div>
            </div>

            {/* ID Proof Document */}
            <div className="p-3 rounded-xl bg-[#fafafc] border border-black/[0.05] space-y-2">
              <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#011627] shrink-0" />
                  <span className="text-[#86868b]">Government ID Proof:</span>
                  {currentIdProofUrl ? (
                    <span className="text-emerald-700 font-semibold">Uploaded</span>
                  ) : (
                    <span className="text-[#86868b]">Not Uploaded</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {currentIdProofUrl && (
                    <a
                      href={currentIdProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-[#f5f5f7] text-[#011627] border border-black/[0.1] shadow-2xs transition active:scale-95"
                    >
                      <span>View Document</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isUploadingProof}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#011627] hover:bg-[#011627]/90 text-white shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isUploadingProof ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{currentIdProofUrl ? 'Upload Again' : 'Upload Document'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {uploadError && (
                <p className="text-[11px] text-rose-600 font-medium">
                  {uploadError}
                </p>
              )}
            </div>
          </div>

          {/* Section 2: Allotment & Mess Configuration */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
              <DoorOpen className="w-3.5 h-3.5 text-[#011627]" />
              <span>Room Allotment & Mess Plan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#fafafc] border border-black/[0.05] flex items-center justify-between">
                <span className="text-[#86868b]">Assigned Space:</span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white text-[#1d1d1f] border border-black/[0.08] font-medium">
                    <DoorOpen className="w-3 h-3 text-[#011627]" />
                    Room {resident.room_no}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white text-[#1d1d1f] border border-black/[0.08] font-medium">
                    <Bed className="w-3 h-3 text-violet-600" />
                    Bed {resident.bed_no}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#fafafc] border border-black/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#86868b]">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>Meal Allowance:</span>
                </div>
                <select
                  value={resident.meals_per_day || 3}
                  onChange={(e) => handleMealChange(Number(e.target.value))}
                  disabled={updatingMealPlan}
                  className="text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100/70 border border-amber-200/80 rounded-lg px-2.5 py-1 cursor-pointer outline-none transition disabled:opacity-50"
                >
                  <option value={1}>1 meal per day</option>
                  <option value={2}>2 meals per day</option>
                  <option value={3}>3 meals per day</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Fee Details & Financial Management */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fee Details & Balances</span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isPending
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isPending ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>Pending</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Fees Cleared</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {/* 1. Monthly Rent (Editable) */}
              <div className="p-3 rounded-xl bg-[#fafafc] border border-black/[0.05]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#86868b] block font-medium">Monthly Rent</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRentInput(String(currentMonthlyRent));
                      setIsEditingRent(!isEditingRent);
                    }}
                    className="text-[10px] text-[#011627] hover:underline font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                    title="Edit Monthly Rent"
                  >
                    <Edit2 className="w-2.5 h-2.5 text-[#011627]" />
                    <span>{isEditingRent ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                {isEditingRent ? (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="relative flex-1">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-[#86868b]">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={rentInput}
                        onChange={(e) => setRentInput(e.target.value)}
                        className="w-full pl-4 pr-1 py-1 text-xs font-mono font-bold bg-white border border-[#011627]/40 rounded-lg outline-none focus:ring-1 focus:ring-[#011627]"
                        autoFocus
                      />
                    </div>
                    <button
                      type="button"
                      disabled={savingRent}
                      onClick={handleSaveRent}
                      className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 cursor-pointer disabled:opacity-50"
                      title="Save"
                    >
                      {savingRent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <span className="font-mono font-bold text-[#1d1d1f] text-xs sm:text-sm mt-0.5 block">
                    ₹{Number(currentMonthlyRent).toLocaleString()}
                  </span>
                )}
              </div>

              {/* 2. Caution Deposit */}
              <div className="p-3 rounded-xl bg-[#fafafc] border border-black/[0.05]">
                <span className="text-[10px] text-[#86868b] block font-medium">Caution Deposit</span>
                <span className="font-mono font-semibold text-[#1d1d1f] mt-0.5 block">
                  ₹{Number(resident.caution_deposit || 0).toLocaleString()}
                </span>
              </div>

              {/* 3. Next Due Date & Billing Cycle (Editable: Monthly / Weekly / Date) */}
              <div className="p-3 rounded-xl bg-[#fafafc] border border-black/[0.05]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#86868b] block font-medium">Next Due Date</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDueDateInput(currentNextDueDate || new Date().toISOString().split('T')[0]);
                      setIsEditingDueDate(!isEditingDueDate);
                    }}
                    className="text-[10px] text-[#011627] hover:underline font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                    title="Edit Next Due Date"
                  >
                    <Calendar className="w-2.5 h-2.5 text-[#011627]" />
                    <span>{isEditingDueDate ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                {isEditingDueDate ? (
                  <div className="space-y-1.5 mt-1">
                    <input
                      type="date"
                      value={dueDateInput}
                      disabled={savingDueDate}
                      onChange={(e) => {
                        setDueDateInput(e.target.value);
                        handleSaveDueDate(e.target.value);
                      }}
                      className="w-full text-xs font-mono font-semibold bg-white border border-[#011627]/40 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-[#011627] text-[#011627]"
                    />
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDueCycle('monthly');
                          if (dueDateInput) handleSaveDueDate(dueDateInput, 'monthly');
                        }}
                        className={`text-[9px] px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                          dueCycle === 'monthly'
                            ? 'bg-[#011627] text-white'
                            : 'bg-black/[0.05] text-[#515154] hover:bg-black/[0.1]'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDueCycle('weekly');
                          if (dueDateInput) handleSaveDueDate(dueDateInput, 'weekly');
                        }}
                        className={`text-[9px] px-2 py-0.5 rounded font-semibold transition cursor-pointer ${
                          dueCycle === 'weekly'
                            ? 'bg-[#011627] text-white'
                            : 'bg-black/[0.05] text-[#515154] hover:bg-black/[0.1]'
                        }`}
                      >
                        Weekly
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="font-mono font-medium text-[#011627] text-xs sm:text-sm mt-0.5 block truncate">
                      {currentNextDueDate || `${currentFeeDueDay}th ${dueCycle}`}
                    </span>
                    <span className="text-[9px] text-[#86868b] block capitalize">
                      {dueCycle} cycle ({currentFeeDueDay}th)
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[#fafafc] border border-black/[0.05]">
                <span className="text-[10px] text-[#86868b] block">Pending Due</span>
                <span
                  className={`font-mono font-bold mt-0.5 block ${
                    isPending ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  ₹{Number(resident.pending || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Financial Action Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRecordPayment?.(resident);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>

              <button
                type="button"
                onClick={() => trigger1ClickWhatsAppReminder(resident)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xs transition cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.06 7.42C8.89 7.42 8.61 7.49 8.37 7.74C8.13 8 7.45 8.63 7.45 9.94C7.45 11.25 8.4 12.52 8.53 12.7C8.66 12.87 10.37 15.65 13.06 16.7C15.31 17.57 15.76 17.4 16.25 17.36C16.74 17.31 17.84 16.7 18.07 16.06C18.3 15.41 18.3 14.86 18.23 14.74C18.16 14.62 17.99 14.56 17.73 14.43C17.48 14.3 16.25 13.7 16.02 13.61C15.79 13.53 15.63 13.48 15.46 13.74C15.29 14 14.81 14.56 14.66 14.73C14.52 14.9 14.37 14.92 14.12 14.8C13.86 14.67 12.79 14.28 11.51 13.14C10.52 12.26 9.85 11.17 9.65 10.83C9.46 10.49 9.63 10.3 9.76 10.17C9.88 10.05 10.02 9.86 10.16 9.7C10.29 9.53 10.34 9.4 10.43 9.23C10.51 9.06 10.47 8.91 10.41 8.78C10.34 8.65 9.83 7.41 9.62 6.9C9.41 6.4 9.2 6.47 9.05 6.47L9.06 7.42Z" />
                </svg>
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewHistory?.(resident);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#f5f5f7] hover:bg-black/[0.05] text-[#1d1d1f] border border-black/[0.08] transition cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-[#011627]" />
                <span>Ledger History</span>
              </button>
            </div>
          </div>

          {/* Section 4: Resident Portal Magic Link Dispatch */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <Sparkles className="w-3.5 h-3.5 text-[#011627]" />
                <span>Resident Portal Access</span>
              </div>
              <p className="text-[#86868b] text-[11px] mt-0.5">
                Send passwordless 1-click magic login link directly to {resident.email}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSendMagicLink?.(resident)}
              disabled={sendingLink[resident.id]}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 ${
                linkSentSuccess[resident.id]
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-[#011627]/10 hover:bg-[#011627]/15 text-[#011627] border border-[#011627]/20'
              }`}
            >
              {sendingLink[resident.id] ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : linkSentSuccess[resident.id] ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Sent!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#011627]" />
                  <span>Send Magic Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-black/[0.08] bg-[#fafafc] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1d1d1f] bg-white hover:bg-[#f5f5f7] border border-black/[0.1] shadow-2xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
