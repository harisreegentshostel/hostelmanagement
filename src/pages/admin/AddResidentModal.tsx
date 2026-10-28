import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { compressImage, formatBytes } from '../../lib/imageCompression';
import { getDayOrdinal, advanceOneMonth } from '../../lib/fees';
import {
  X,
  Upload,
  User,
  Phone,
  Mail,
  Bed,
  DoorOpen,
  IndianRupee,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  AlertTriangle,
  Zap,
  Sparkles,
  Utensils
} from 'lucide-react';

interface AddResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResidentAdded: () => void;
}

export const AddResidentModal: React.FC<AddResidentModalProps> = ({
  isOpen,
  onClose,
  onResidentAdded,
}) => {
  const calculateDefaultNextPaymentDate = (baseDate?: string): string => {
    return advanceOneMonth(baseDate || new Date().toISOString().split('T')[0]);
  };

  const [admissionNo, setAdmissionNo] = useState<number>(1);
  const [name, setName] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [bedNo, setBedNo] = useState('');
  const [cautionDeposit, setCautionDeposit] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [pending, setPending] = useState('0');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [nextPaymentDate, setNextPaymentDate] = useState(() => calculateDefaultNextPaymentDate());
  const [mobileNo, setMobileNo] = useState('');
  const [email, setEmail] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState<number>(3);
  const [sendInviteLink, setSendInviteLink] = useState(true);

  // ID Proof image & compression state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    original: string;
    compressed: string;
    ratio: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetchingNextId, setFetchingNextId] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchNextAdmissionNo = async () => {
    setFetchingNextId(true);
    try {
      const { data, error } = await supabase
        .from('residents')
        .select('admission_no')
        .order('admission_no', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error fetching admission_no:', error.message);
        setAdmissionNo(1);
      } else if (data && data.length > 0 && data[0].admission_no) {
        setAdmissionNo(Number(data[0].admission_no) + 1);
      } else {
        setAdmissionNo(1);
      }
    } catch {
      setAdmissionNo(1);
    } finally {
      setFetchingNextId(false);
    }
  };

  const resetForm = () => {
    setName('');
    setRoomNo('');
    setBedNo('');
    setCautionDeposit('');
    setMonthlyFee('');
    setPending('0');
    setMealsPerDay(3);
    const todayStr = new Date().toISOString().split('T')[0];
    setJoiningDate(todayStr);
    setNextPaymentDate(calculateDefaultNextPaymentDate(todayStr));
    setMobileNo('');
    setEmail('');
    setImageFile(null);
    setImagePreview(null);
    setCompressionInfo(null);
    setCompressing(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Fetch the next admission number when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNextAdmissionNo();
      resetForm();
    }
  }, [isOpen]);

  // Select image and apply client-side compression before uploading
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      setErrorMessage(null);
      setCompressing(true);

      try {
        const result = await compressImage(file, 1600, 1600, 0.8);
        setImageFile(result.file);
        setImagePreview(URL.createObjectURL(result.file));
        setCompressionInfo({
          original: formatBytes(result.originalSize),
          compressed: formatBytes(result.compressedSize),
          ratio: result.compressionRatio,
        });
      } catch (err: any) {
        console.warn('Compression failed, falling back to original file:', err);
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!name.trim()) return setErrorMessage('Name is required.');
    if (!roomNo.trim()) return setErrorMessage('Room number is required.');
    if (!bedNo.trim()) return setErrorMessage('Bed number is required.');
    if (!joiningDate) return setErrorMessage('Joining date is required.');
    if (!cautionDeposit) return setErrorMessage('Caution deposit is required.');
    if (!monthlyFee) return setErrorMessage('Monthly fee is required.');
    if (!nextPaymentDate) return setErrorMessage('Next fee payment day is required.');
    if (!mobileNo.trim()) return setErrorMessage('Mobile number is required.');
    if (!email.trim()) return setErrorMessage('Email address is required.');

    setLoading(true);

    try {
      let idProofUrl: string | null = null;

      // 1. Upload COMPRESSED image to Supabase Storage if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `admission_${admissionNo}_${Date.now()}.${fileExt}`;
        const filePath = `id_proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resident-ids')
          .upload(filePath, imageFile, {
            contentType: imageFile.type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Storage error: ${uploadError.message}. Make sure the 'resident-ids' bucket is created in Supabase.`);
        }

        const { data: urlData } = supabase.storage
          .from('resident-ids')
          .getPublicUrl(filePath);

        idProofUrl = urlData.publicUrl;
      }

      // 2. Insert record into public.residents with joining_date, next_fee_payment_date, fee_due_day, and pending
      const normalizedEmail = email.trim().toLowerCase();
      const fixedDueDay = nextPaymentDate ? parseInt(nextPaymentDate.split('-')[2], 10) : 5;
      const initialPending = parseFloat(pending || '0');

      const residentPayload: Record<string, any> = {
        admission_no: admissionNo,
        name: name.trim(),
        id_proof_url: idProofUrl,
        room_no: roomNo.trim(),
        bed_no: bedNo.trim(),
        caution_deposit: parseFloat(cautionDeposit),
        monthly_fee: parseFloat(monthlyFee),
        pending: initialPending,
        joining_date: joiningDate,
        next_fee_payment_date: nextPaymentDate || null,
        fee_due_day: fixedDueDay,
        mobile_no: mobileNo.trim(),
        email: normalizedEmail,
        meals_per_day: mealsPerDay,
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('residents')
        .insert([residentPayload])
        .select('id')
        .maybeSingle();

      let residentId = insertedData?.id;

      if (insertError) {
        // Graceful fallback if fee_due_day, next_fee_payment_date, or meals_per_day column hasn't been added to database yet
        if (
          insertError.message.includes('fee_due_day') ||
          insertError.message.includes('next_fee_payment_date') ||
          insertError.message.includes('meals_per_day') ||
          insertError.code === 'PGRST204' ||
          insertError.code === '42703'
        ) {
          console.warn('Columns missing in Supabase schema. Retrying without new columns...');
          delete residentPayload.fee_due_day;
          delete residentPayload.next_fee_payment_date;
          delete residentPayload.meals_per_day;
          const { data: retryData, error: retryError } = await supabase
            .from('residents')
            .insert([residentPayload])
            .select('id')
            .maybeSingle();
          if (retryError) {
            throw new Error(`Database error: ${retryError.message}`);
          }
          residentId = retryData?.id;
        } else {
          throw new Error(`Database error: ${insertError.message}`);
        }
      }

      // Record initial pending transaction in fee ledger
      if (residentId && initialPending > 0) {
        try {
          await supabase.from('fee_transactions').insert([
            {
              resident_id: residentId,
              type: 'INITIAL_PENDING',
              amount: initialPending,
              balance_before: 0,
              balance_after: initialPending,
              billing_date: nextPaymentDate || joiningDate,
              description: 'Initial opening pending balance recorded at admission',
            },
          ]);
        } catch (txErr) {
          console.warn('Initial fee transaction log skipped:', txErr);
        }
      }

      // 3. Dispatch Supabase Magic Login Link to resident's email
      if (sendInviteLink) {
        try {
          const redirectUrl = `${window.location.origin}/resident`;
          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                role: 'resident',
                name: name.trim(),
              },
            },
          });

          if (otpError) {
            console.warn('Magic link dispatch issue:', otpError.message);
            setSuccessMessage(
              `Resident "${name}" registered (#${admissionNo})! Note: Email delivery returned: ${otpError.message}. You can resend the link from the admin table.`
            );
          } else {
            setSuccessMessage(
              `Resident "${name}" registered (#${admissionNo})! Magic Login Link dispatched to ${normalizedEmail}.`
            );
          }
        } catch (otpErr: any) {
          console.warn('Otp catch:', otpErr);
          setSuccessMessage(
            `Resident "${name}" registered (#${admissionNo})! You can send their magic login link from the admin table.`
          );
        }
      } else {
        setSuccessMessage(`Resident "${name}" registered successfully with Admission No. #${admissionNo}!`);
      }

      setTimeout(() => {
        onResidentAdded();
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add resident. Check Supabase connection.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-black/[0.08] rounded-3xl shadow-2xl overflow-hidden my-8 text-[#1d1d1f]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08] bg-[#fafafc]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#011627]/10 text-[#011627] border border-[#011627]/20 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1d1d1f] leading-tight">Add New Resident</h2>
              <p className="text-xs text-[#86868b] mt-0.5">Hostel Admission & Allotment Form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#86868b] hover:text-[#1d1d1f] rounded-xl hover:bg-black/[0.05] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. Admission Number & Joining Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Admission Number (Auto-generated, Read-only) */}
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                Admission Number
              </label>
              <div className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.08] rounded-xl text-sm font-semibold text-[#1d1d1f] flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono">
                  <Lock className="w-3.5 h-3.5 text-[#011627]" />
                  <span className="text-[#011627] font-bold">
                    {fetchingNextId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `# ${admissionNo}`}
                  </span>
                </div>
                <span className="text-[10px] text-[#86868b] uppercase tracking-wider font-medium">
                  Auto-generated
                </span>
              </div>
            </div>

            {/* Joining Date */}
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                Joining Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-[#86868b]" />
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => {
                    const newJoining = e.target.value;
                    setJoiningDate(newJoining);
                    if (newJoining) {
                      setNextPaymentDate(calculateDefaultNextPaymentDate(newJoining));
                    }
                  }}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 outline-none transition [color-scheme:light]"
                />
              </div>
            </div>
          </div>

          {/* 2. Personal Information: Full Name & Mobile Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-[#86868b]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 outline-none transition placeholder-[#86868b]"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-[#86868b]" />
                <input
                  type="tel"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 outline-none transition placeholder-[#86868b]"
                />
              </div>
            </div>
          </div>

          {/* 3. Email Address & Portal Invite Toggle */}
          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#86868b]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 outline-none transition placeholder-[#86868b]"
                />
              </div>
            </div>

            {/* Magic Link Automatic Dispatch Notice */}
            <div className="p-3 rounded-2xl bg-[#011627]/5 border border-[#011627]/15 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-[#011627]/10 text-[#011627] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#1d1d1f] truncate">
                    Send Magic Login Link immediately
                  </p>
                  <p className="text-[11px] text-[#6e6e73] truncate">
                    Sends an email link for 1-click resident portal access.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={sendInviteLink}
                  onChange={(e) => setSendInviteLink(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-[#e5e5ea] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#011627]"></div>
              </label>
            </div>
          </div>

          {/* 4. Room & Bed Allotment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Room Number */}
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                Room Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DoorOpen className="absolute left-3.5 top-3 w-4 h-4 text-[#86868b]" />
                <input
                  type="text"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                  placeholder="e.g. 101"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 outline-none transition placeholder-[#86868b]"
                />
              </div>
            </div>

            {/* Bed Number */}
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                Bed Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Bed className="absolute left-3.5 top-3 w-4 h-4 text-[#86868b]" />
                <input
                  type="text"
                  value={bedNo}
                  onChange={(e) => setBedNo(e.target.value)}
                  placeholder="e.g. Bed A or 1"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 outline-none transition placeholder-[#86868b]"
                />
              </div>
            </div>
          </div>

          {/* 5. Meal Plan Configuration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-[#1d1d1f]">
                Daily Meal Plan <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-[#86868b] flex items-center gap-1">
                <Utensils className="w-3 h-3 text-amber-600" />
                <span>Configures daily meal allowance</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { count: 1, label: '1 Meal Per Day', desc: 'Allows 1 meal selection / day' },
                { count: 2, label: '2 Meals Per Day', desc: 'Allows up to 2 meal selections' },
                { count: 3, label: '3 Meals Per Day', desc: 'Full access to all 3 meals' },
              ].map((option) => {
                const isSelected = mealsPerDay === option.count;
                return (
                  <button
                    key={option.count}
                    type="button"
                    onClick={() => setMealsPerDay(option.count)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#011627]/5 border-[#011627] ring-2 ring-[#011627]/20 shadow-xs'
                        : 'bg-[#fafafc] border-black/[0.08] hover:border-black/[0.15] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#011627] text-white' : 'bg-black/[0.05] text-[#86868b]'
                        }`}
                      >
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? 'border-[#011627] bg-[#011627] text-white'
                            : 'border-black/[0.2] bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${isSelected ? 'text-[#011627]' : 'text-[#1d1d1f]'}`}>
                        {option.label}
                      </div>
                      <div className="text-[11px] text-[#86868b] leading-tight mt-0.5">
                        {option.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Fee Structure & Billing Schedule */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Monthly Fee */}
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                  Monthly Fee (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-[#86868b]" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 outline-none transition placeholder-[#86868b]"
                  />
                </div>
              </div>

              {/* Caution Deposit */}
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                  Caution Deposit (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-[#86868b]" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cautionDeposit}
                    onChange={(e) => setCautionDeposit(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 outline-none transition placeholder-[#86868b]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Next Fee Payment Day */}
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                  Next Fee Payment Day <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-[#011627]" />
                  <input
                    type="date"
                    value={nextPaymentDate}
                    onChange={(e) => setNextPaymentDate(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-[#011627] focus:ring-4 focus:ring-[#011627]/15 outline-none transition [color-scheme:light]"
                  />
                </div>
                <span className="text-[11px] text-[#011627] font-medium mt-1.5 flex items-center gap-1">
                  <span>Fixed monthly due: <strong>{getDayOrdinal(nextPaymentDate ? parseInt(nextPaymentDate.split('-')[2], 10) : 5)}</strong> of every month</span>
                </span>
              </div>

              {/* Pending Amount */}
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
                  Opening Pending Dues (₹)
                </label>
                <div className="relative">
                  <AlertTriangle className="absolute left-3.5 top-3 w-4 h-4 text-amber-500" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={pending}
                    onChange={(e) => setPending(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#f5f5f7] border border-black/[0.1] rounded-xl text-sm text-[#1d1d1f] focus:bg-white focus:border-amber-500 outline-none transition placeholder-[#86868b]"
                  />
                </div>
                <span className="text-[11px] text-[#86868b] mt-1.5 block">0 if no prior balance</span>
              </div>
            </div>
          </div>

          {/* ID Proof Image Upload with Client-Side Compression */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#1d1d1f]">
                ID Proof (Upload Image / Aadhaar / College ID)
              </label>
              <span className="text-[11px] text-[#011627] flex items-center gap-1 font-medium">
                <Zap className="w-3 h-3" /> Auto-compressed before upload
              </span>
            </div>

            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-black/[0.12] rounded-2xl hover:border-[#011627] bg-[#fafafc] transition">
              <div className="space-y-2 text-center w-full">
                {compressing ? (
                  <div className="py-6 flex flex-col items-center justify-center text-[#011627] text-xs">
                    <Loader2 className="w-7 h-7 animate-spin mb-2" />
                    <span className="font-medium">Compressing image for fast upload...</span>
                  </div>
                ) : imagePreview ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={imagePreview}
                      alt="Compressed ID Preview"
                      className="h-36 max-w-full object-contain rounded-xl border border-black/[0.1] mb-3 shadow-sm bg-white"
                    />

                    {/* Compression Statistics Badge */}
                    {compressionInfo && (
                      <div className="mb-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Compressed: {compressionInfo.original} &rarr; {compressionInfo.compressed} ({compressionInfo.ratio}% saved)
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setCompressionInfo(null);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer font-medium"
                    >
                      Remove & choose another image
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-8 w-8 text-[#86868b]" />
                    <div className="flex text-xs text-[#6e6e73] justify-center">
                      <label className="relative cursor-pointer rounded-md font-semibold text-[#011627] hover:underline">
                        <span>Click to choose file</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="pl-1">or take a photo</p>
                    </div>
                    <p className="text-[11px] text-[#86868b]">
                      Images are automatically compressed to ~200KB before uploading to Supabase
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-black/[0.08] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || compressing}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#1d1d1f] hover:bg-[#e8e8ed] bg-[#f5f5f7] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || compressing}
              className="px-5 py-2.5 rounded-xl text-xs font-medium text-white bg-[#011627] hover:bg-[#0b253a] shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to Supabase...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Register Resident</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
